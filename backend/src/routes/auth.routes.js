import express from "express";
import { signup, login, logout, onboard, refreshToken } from "../controllers/auth.controller.js";
import { sendVerificationOTP, verifyEmail, resendOTP } from "../controllers/otp.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { otpRateLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post("/refresh", refreshToken);

router.post("/send-verification-otp", protectRoute, otpRateLimiter, sendVerificationOTP);
router.post("/verify-email", protectRoute, otpRateLimiter, verifyEmail);
router.post("/resend-otp", protectRoute, otpRateLimiter, resendOTP);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.post("/onboarding", protectRoute, onboard);
router.get("/get-me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
