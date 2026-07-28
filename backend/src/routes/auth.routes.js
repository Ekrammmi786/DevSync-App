import express from "express";
import { signup, login, logout, onboard, refreshToken } from "../controllers/auth.controller.js";
import { sendVerificationOTP, verifyEmail, resendOTP } from "../controllers/otp.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { loginRateLimiter, otpRateLimiter, signupRateLimiter } from "../middleware/rateLimiter.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { signupSchema } from "../validations/auth.validation.js";
import { forgotPassword,resetPassword } from "../controllers/password.controller.js";
const router = express.Router();

router.post("/refresh", refreshToken);

router.post("/send-verification-otp", protectRoute, otpRateLimiter, sendVerificationOTP);
router.post("/verify-email", protectRoute, otpRateLimiter, verifyEmail);
router.post("/resend-otp", protectRoute, otpRateLimiter, resendOTP);

router.post("/signup",signupRateLimiter,validate(signupSchema), signup);
router.post("/login",loginRateLimiter,login);;
router.post("/logout", protectRoute, logout);
router.post("/onboarding", protectRoute, onboard);
router.get("/get-me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
router.post("/forgot-password", otpRateLimiter, forgotPassword);
router.post("/reset-password", otpRateLimiter, resetPassword);

export default router;
