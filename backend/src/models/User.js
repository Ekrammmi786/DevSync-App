import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 256,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    profilePic: {
      type: String,
      default: "",
      maxlength: 2048,
    },

    codinglanguage: { type: [String], default: [] },

    learninglanguage: { type: [String], default: [] },
    
    location: {
      type: String,
      default: "",
      maxlength: 100,
    },
    role: {
      type: String,
      default: "",
      maxlength: 50,
    },
    isOnBoarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    techStack: [
      {
        type: String,
        default: "",
      },
    ],
    interests: [
      {
        type: String,
        default: "",
      },
    ],
    lookingFor: {
      type: String,
      enum: [
        "Mentor",
        "Project Collaborator",
        "Interview Partner",
        "learning Buddy",
        "Other",
      ],
      default: "learning Buddy",
    },
    availability: {
      type: String,
      enum: ["Full Time", "Part Time", "Occasional", "Other"],
      default: "Occasional",
    },
    timezone: {
      type: String,
      default: "",
      maxlength: 50,
    },
    githubUsername: {
      type: String,
      default: "",
      maxlength: 100,
    },
    linkedinUsername: {
      type: String,
      default: "",
      maxlength: 100,
    },
    portfolioUrl: {
      type: String,
      default: "",
      maxlength: 2048,
    },
    experience: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    devScore: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: String,
      },
    ],
    completedProjects: {
      type: Number,
      default: 0,
    },
    completedInterviews: {
      type: Number,
      default: 0,
    },
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Pro", "Enterprise"],
      default: "Free",
    },

    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: null, select: false },
    otpExpiry: { type: Date, default: null, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpResendCount: { type: Number, default: 0, select: false },
    otpResendWindowStart: { type: Date, default: null, select: false },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.index({ fullname: 1 });
userSchema.index({ isOnBoarded: 1 });
userSchema.index({ email: 1 });
userSchema.index({ codinglanguage: 1 });
userSchema.index({ learninglanguage: 1 });
userSchema.index({ location: 1 });
userSchema.index({ role: 1 });
userSchema.index({ techStack: 1 });
userSchema.index({ interests: 1 });
userSchema.index({ lookingFor: 1 });
userSchema.index({ availability: 1 });
userSchema.index({ timezone: 1 });
userSchema.index({ githubUsername: 1 });
userSchema.index({ linkedinUsername: 1 });
userSchema.index({ portfolioUrl: 1 });
userSchema.index({ experience: 1 });
userSchema.index({ devScore: 1 });
userSchema.index({ badges: 1 });
userSchema.index({ completedProjects: 1 });
userSchema.index({ completedInterviews: 1 });
userSchema.index({ subscriptionPlan: 1 });
userSchema.index({ isVerified: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
