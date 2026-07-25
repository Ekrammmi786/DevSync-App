import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:{
        success:false,message:"To many requests",code:"rate limit exceeded"},
        standardHeaders:true,
        legacyHeaders:false,

    
});
