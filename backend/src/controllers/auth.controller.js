import User from "../models/user.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { upsertStreamUser } from "../lib/stream.js";
import { generateOTP, hashOTP } from "../services/otp.services.js";
import { sendOtpEmail } from "../services/email.services.js";

export async function signup(req, res) {
  const { email, password, fullname } = req.body;

  try {
    if (!email || !password || !fullname) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const idx = Math.floor(Math.random() * (99 - 11 + 1)) + 11;

    const randomAvatar = `https://testingbot.com/free-online-tools/random-avatar/4${idx}`;

    const newUser = await User.create({
      email,
      fullname,
      password,
      profilePic: randomAvatar,
    });

    try {
      const otp = generateOTP();
      await User.findByIdAndUpdate(newUser._id, {
        otpHash: hashOTP(otp),
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      await sendOtpEmail(newUser.email, otp);
    } catch (err) {
      console.error("OTP generation/sending failed:", err);
    }

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullname,
        image: newUser.profilePic || "",
      });
    } catch (error) {
      console.error("Error creating/updating user in Stream:", error);
    }

    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    await User.findByIdAndUpdate(newUser._id, { refreshToken });

    res.cookie("jwt", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      path: "/api/auth/refresh",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error(error);

   if(error.message.includes('quota')||error.message.includes('spaces')){
    return res.status(507).json({
      success:false,
      message:"server storage limit reached,please contact admin",
      code:"STORAGE_QUOTA-EXCEEDED"
    });
   }
  return res.status(500).json({
    success:false,
    message:"internal server error or in signup process"
  })
    
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie("jwt", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      path: "/api/auth/refresh",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function logout(req, res) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
  } catch (err) {
    console.error("Logout DB error:", err);
  }

  res.clearCookie("jwt");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function refreshToken(req, res) {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token",
        code: "NO_REFRESH_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user || !user.refreshToken || user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token revoked or user not found",
        code: "REFRESH_TOKEN_REVOKED",
      });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    res.cookie("jwt", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullname, bio, codingLanguage, learningLanguage, location, role } =
      req.body;

    const codinglanguage = codingLanguage;
    const learninglanguage = learningLanguage;

    if (
      !fullname ||
      !bio ||
      !codingLanguage ||
      !learningLanguage ||
      !location ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullname && "fullname",
          !bio && "bio",
          !codingLanguage && "codingLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
          !role && "role",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        bio,
        codinglanguage: codinglanguage,
        learninglanguage: learninglanguage,
        location,
        role,
        isOnBoarded: true,
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullname,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) {
      console.log(
        `Error occurred while creating/updating stream user for user ${updatedUser.fullname}:`,
        streamError,
      );
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
}
