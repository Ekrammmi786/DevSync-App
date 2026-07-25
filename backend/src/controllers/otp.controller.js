import User from "../models/User.js";
import { generateOTP,hashOTP,verifyOTP,isOTPExpired } from "../services/otp.services.js";
import { sendOtpEmail } from "../services/email.services.js";
import ApiError from "../utils/Apierror.js";
import AsyncHandler from "../utils/asyncHandler.js";

export const sendVerificationOTP = AsyncHandler(async (req,res)=>{
    if(req.user.isVerified) throw new ApiError(400,"already verified","ALREADY_VERIFIED");
    const otp= generateOTP();
    await User.findByIdAndUpdate(req.user._id,{
        otpHash:hashOTP(otp),
        otpExpiry:new Date(Date.now() + 10 * 60 * 1000),
        otpAttempts:0,
        otpResendCount:0,
        otpResendWindowStart:null,
    
    })
    await sendOtpEmail(req.user.email,otp);
    res.json({success:true,
        message:"otp sent successfully"
    })
});
export const verifyEmail = AsyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(400, "OTP is required", "OTP_REQUIRED");
  
  const user = await User.findById(req.user._id).select("+otpHash +otpExpiry +otpAttempts");
  if (!user.otpHash) throw new ApiError(400, "No OTP requested", "NO_OTP");
  if (isOTPExpired(user.otpExpiry)) throw new ApiError(400, "OTP expired", "OTP_EXPIRED");
  if (user.otpAttempts >= 5) throw new ApiError(429, "Max attempts exceeded", "MAX_ATTEMPTS");

  if (!verifyOTP(otp, user.otpHash)) {
    await User.findByIdAndUpdate(user._id, { $inc: { otpAttempts: 1 } });
    throw new ApiError(400, "Invalid OTP", "INVALID_OTP");
  }

  await User.findByIdAndUpdate(user._id, {
    isVerified: true,
    $unset: { otpHash: 1, otpExpiry: 1, otpAttempts: 1, otpResendCount: 1, otpResendWindowStart: 1 },
  });
  res.json({ success: true, message: "Email verified successfully" });
});

export const resendOTP = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+otpResendCount +otpResendWindowStart");
  const now = new Date();

  let resendCount = user.otpResendCount || 0;
  let windowStart = user.otpResendWindowStart;

  if (!windowStart || now - windowStart > 30 * 60 * 1000) {
    windowStart = now;
    resendCount = 0;
  }

  if (resendCount >= 3) throw new ApiError(429, "Max resends reached", "MAX_RESENDS");

  const otp = generateOTP();
  await User.findByIdAndUpdate(user._id, {
    otpHash: hashOTP(otp),
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    otpAttempts: 0,
    otpResendCount: resendCount + 1,
    otpResendWindowStart: windowStart,
  });
  await sendOtpEmail(user.email, otp);
  res.json({ success: true, message: "OTP resent successfully" });
});


