import express from "express";
import { signup, login, logout, onboard, refreshToken } from "../controllers/auth.controller.js";
import { sendVerificationOTP, verifyEmail, resendOTP } from "../controllers/otp.controller.js";
import { protectRoute, requireVerified } from "../middleware/auth.middleware.js";
import { loginRateLimiter, otpRateLimiter, signupRateLimiter, refreshRateLimiter } from "../middleware/rateLimiter.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validations/auth.validation.js";
import { forgotPassword, resetPassword } from "../controllers/password.controller.js";

const router = express.Router();

// Token refresh — no auth needed (uses the refresh cookie)
router.post("/refresh", refreshRateLimiter, refreshToken);

// OTP / email verification — must be authenticated
router.post("/send-verification-otp", protectRoute, otpRateLimiter, sendVerificationOTP);
router.post("/verify-email", protectRoute, otpRateLimiter, verifyEmail);
router.post("/resend-otp", protectRoute, otpRateLimiter, resendOTP);

// Auth — public
router.post("/signup", signupRateLimiter, validate(signupSchema), signup);
router.post("/login", loginRateLimiter, validate(loginSchema), login);

// Protected
router.post("/logout", protectRoute, logout);
router.post("/onboarding", protectRoute, requireVerified, onboard);
router.get("/get-me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Password reset — public, rate-limited and validated
router.post("/forgot-password", otpRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", otpRateLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
