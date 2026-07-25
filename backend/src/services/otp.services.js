import crypto from "crypto";

export const generateOTP = ()=> crypto.randomInt(100000,999999).toString();

export const hashOTP =(otp) =>crypto.createHash("sha256").update(otp).digest("hex");

export const verifyOTP = (plainOTP, hashedOTP) => hashOTP(plainOTP) === hashedOTP;

export const isOTPExpired = (expiryDate)=>new Date()>expiryDate