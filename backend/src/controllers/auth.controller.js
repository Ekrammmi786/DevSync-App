import User from "../models/user.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { upsertStreamUser } from "../lib/stream.js";

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
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullname,
        image: newUser.profilePic || "",
      });

      console.log(`Stream user created/updated for user ${newUser._id}`);
    } catch (error) {
      console.error("Error creating/updating user in Stream:", error);
    }

    const token = jwt.sign(
      {
        userId: newUser._id,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
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

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
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

export function logout(req, res) {
  res.clearCookie("jwt");

  return res.status(200).json({
    message: "Logged out successfully",
  });
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
      console.log(`Stream user updated for user ${updatedUser.fullname}`);
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