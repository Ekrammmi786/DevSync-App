import User from "../models/User.js";
import { generateOTP,hashOTP,verifyOTP,isOTPExpired } from "../services/otp.services.js";
import { sendPasswordResetEmail } from "../services/email.services.js";
import ApiError from "../utils/Apierror.js";
import AsyncHandler from "../utils/asyncHandler.js";

export const forgotPassword = AsyncHandler(async(req,res)=>{
    const {email}= req.body;

    if(!email) throw new ApiError(400,"Email is required","EMAIL_REQUIRED");

    const user = await User.findOne({email});

    if(!user){
        return res.json({
        success:true,
        data:{message:"if this email exist the otp sent on your email"}
        });
    }

    const otp = generateOTP();
    await User.findByIdAndUpdate(user._id,{
            otpHash: hashOTP(otp),
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
            otpAttempts: 0,
            otpResendCount: 0,
            otpResendWindowStart: null,  
    })
    await sendPasswordResetEmail(user.email,otp);
   
    res.json({
        success:true,
        data:{
            message:"is this email exists a reset otp has been sent"
        }
    })
});

export const resetPassword = AsyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP and new password are required", "FIELDS_REQUIRED");
  }

   if (newPassword.length < 8) {
     throw new ApiError(400, "Password must be at least 8 characters", "WEAK_PASSWORD");
   }
   if (!/[A-Z]/.test(newPassword)) {
     throw new ApiError(400, "Password must contain an uppercase letter", "WEAK_PASSWORD");
   }
   if (!/[a-z]/.test(newPassword)) {
     throw new ApiError(400, "Password must contain a lowercase letter", "WEAK_PASSWORD");
   }
   if (!/[0-9]/.test(newPassword)) {
     throw new ApiError(400, "Password must contain a number", "WEAK_PASSWORD");
   }
   if (!/[^A-Za-z0-9]/.test(newPassword)) {
     throw new ApiError(400, "Password must contain at least one special character", "WEAK_PASSWORD");
   }

  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpiry +otpAttempts"
  );
  if (!user) throw new ApiError(400, "Invalid request", "INVALID_REQUEST");

  if (!user.otpHash) throw new ApiError(400, "No OTP requested", "NO_OTP");
  if (isOTPExpired(user.otpExpiry)) throw new ApiError(400, "OTP expired", "OTP_EXPIRED");
  if (user.otpAttempts >= 5) throw new ApiError(429, "Too many attempts", "MAX_ATTEMPTS");

  if (!verifyOTP(otp, user.otpHash)) {
    await User.findByIdAndUpdate(user._id, { $inc: { otpAttempts: 1 } });
    throw new ApiError(400, "Invalid OTP", "INVALID_OTP");
  }

  user.password = newPassword;
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = undefined;
  user.otpResendCount = undefined;
  user.otpResendWindowStart = undefined;
  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    data: { message: "Password reset successfully. Please login with your new password." },
  });
});
