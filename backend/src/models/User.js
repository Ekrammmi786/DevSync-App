import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },

    codinglanguage: { type: [String], default: [] },

    learninglanguage: { type: [String], default: [] },
    
    location: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "",
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
    },
    githubUsername: {
      type: String,
      default: "",
    },
    linkedinUsername: {
      type: String,
      default: "",
    },
    portfolioUrl: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
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
    const salt = await bcrypt.genSalt(10);
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
