import User from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { upsertStreamUser } from "../lib/stream.js";
import { generateOTP, hashOTP } from "../services/otp.services.js";
import { sendOtpEmail } from "../services/email.services.js";
import { calculateDevScore } from "../services/devScore.service.js";
import ApiError from "../utils/Apierror.js";

export async function signup(req, res) {
  const { email, password, fullname, role = "", techStack = [] } = req.body;

  try {
    if (!email || !password || !fullname) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        code: "VALIDATION_ERROR",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        code: "INVALID_EMAIL",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
        code: "USER_EXISTS",
      });
    }

    const idx = Math.floor(Math.random() * (99 - 11 + 1)) + 11;
    const randomAvatar = `https://testingbot.com/free-online-tools/random-avatar/4${idx}`;

    const newUser = await User.create({
      email,
      fullname,
      password,
      profilePic: randomAvatar,
      role,
      techStack,
    });

    const otpPromise = (async () => {
      const otp = generateOTP();
      await User.findByIdAndUpdate(newUser._id, {
        otpHash: hashOTP(otp),
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
      await sendOtpEmail(newUser.email, otp);
    })();

    const streamPromise = (async () => {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullname,
        image: newUser.profilePic || "",
      });
    })();

    const results = await Promise.allSettled([
      Promise.race([otpPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP timeout")), 5000))]),
      Promise.race([streamPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Stream timeout")), 3000))]),
    ]);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Background task failed:", result.reason.message);
      }
    });

    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" },
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
      data: newUser,
    });
  } catch (error) {
    console.error(error);

    if (error.message.includes("quota") || error.message.includes("spaces")) {
      return res.status(507).json({
        success: false,
        message: "Server storage limit reached, please contact admin",
        code: "STORAGE_QUOTA_EXCEEDED",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during signup",
      code: "SERVER_ERROR",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        code: "VALIDATION_ERROR",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" },
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
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
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

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", "", { ...cookieOptions, maxAge: 0 });
  res.cookie("refreshToken", "", { ...cookieOptions, path: "/api/auth/refresh", maxAge: 0 });

  res.clearCookie("jwt", cookieOptions);
  res.clearCookie("refreshToken", { ...cookieOptions, path: "/api/auth/refresh" });

  return res.status(200).json({
    success: true,
    data: { message: "Logged out successfully" },
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
        process.env.JWT_REFRESH_SECRET_KEY,
      );
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (
      !user ||
      !user.refreshToken ||
      user.refreshToken !== incomingRefreshToken
    ) {
      return res.status(401).json({
        success: false,
        message: "Refresh token revoked or user not found",
        code: "REFRESH_TOKEN_REVOKED",
      });
    }

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" },
    );

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" },
    );

    res.cookie("refreshToken", newRefreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      path: "/api/auth/refresh",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("jwt", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      data: { message: "Token refreshed" },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const {
      fullname,
      bio,
      codingLanguage,
      learningLanguage,
      location,
      role,
      techStack,
      interests,
      lookingFor,
      availability,
      timezone,
      githubUsername,
      linkedinUsername,
      portfolioUrl,
      experience,
      profilePic
    } = req.body;

    if (
      !fullname ||
      !bio ||
      !codingLanguage ||
      !learningLanguage ||
      !location ||
      !role || !techStack ||
      !interests
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        code: "VALIDATION_ERROR",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        bio,
        codinglanguage: codingLanguage,
        learninglanguage: learningLanguage,
        location,
        role,
        techStack: techStack || [],
        interests: interests || [],
        lookingFor: lookingFor || "learning Buddy",
        availability: availability || "Occasional",
        timezone: timezone || "",
        githubUsername: githubUsername || "",
        linkedinUsername: linkedinUsername || "",
        portfolioUrl: portfolioUrl || "",
        experience: experience || "",
        profilePic: profilePic || updatedUser?.profilePic || "",
        isOnBoarded: true,
      },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const devScoreResult = calculateDevScore(updatedUser);

    const finalUser = await User.findByIdAndUpdate(
      userId,
      {
        devScore: devScoreResult.score,
        badges: devScoreResult.badges,
      },
      { new: true },
    );

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullname,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) {
      console.error("Stream user update failed:", streamError);
    }

    return res.status(200).json({
      success: true,
      data: {
        user: finalUser,
        devScore: {
          score: devScoreResult.score,
          breakdown: devScoreResult.breakdown,
          badges: devScoreResult.badges,
          missingFields: devScoreResult.missingFields,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}
