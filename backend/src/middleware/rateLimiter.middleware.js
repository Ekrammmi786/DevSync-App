import rateLimit from "express-rate-limit";

// Development/testing mein rate limiting disable kar do taaki bar-bar signup test karne par block na ho.
// Production mein strict limits enforce rehti hain.
const isProduction = process.env.NODE_ENV === "production";

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 100,
  message: {
    success: false,
    message: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 100,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
    code: "LOGIN_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 20 : 100,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Try again later.",
    code: "SIGNUP_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
});
