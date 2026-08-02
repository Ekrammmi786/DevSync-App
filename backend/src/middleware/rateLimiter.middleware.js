import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:{
        success:false,message:"Too many requests",code:"RATE_LIMIT_EXCEEDED"
    },
    standardHeaders:true,
    legacyHeaders:false,

    
});


export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
    code: "LOGIN_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Try again later.",
    code: "SIGNUP_RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
