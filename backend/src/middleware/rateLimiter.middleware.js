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
