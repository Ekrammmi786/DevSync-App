import User from "../models/User.js";
import { generateOTP,hashOTP,verifyOTP,isOTPExpired } from "../services/otp.services.js";
import { sendOtpEmail } from "../services/email.services.js";
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
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min valid
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

   if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters", "WEAK_PASSWORD");
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

  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpiry +otpAttempts"
  );
  if (!user) throw new ApiError(400, "Invalid request", "INVALID_REQUEST");

  // OTP validation
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
  await user.save();

  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    data: { message: "Password reset successfully. Please login with your new password." },
  });
});

    const sendPasswordResetEmail = async (email, otp) => {
  const nodemailer = (await import("nodemailer")).default;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "DevSync - Password Reset OTP",
    html: `
<div style="background:#eef2f7;padding:50px 20px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:500px;margin:auto;background:#eef2f7;border-radius:25px;padding:40px;text-align:center;
      box-shadow:12px 12px 24px #cfd5df,-12px -12px 24px #ffffff;">
    <h2 style="color:#1e3a8a;margin-bottom:25px;">Reset Your Password</h2>
    <p style="color:#6b7280;margin-bottom:20px;">Use this OTP to reset your password</p>
    <div style="display:inline-block;padding:18px 45px;border-radius:18px;background:#eef2f7;color:#2563eb;
        font-size:34px;font-weight:bold;letter-spacing:8px;
        box-shadow:inset 6px 6px 12px #cfd5df,inset -6px -6px 12px #ffffff,
        6px 6px 15px rgba(0,0,0,.08),-6px -6px 15px rgba(255,255,255,.9);">
      ${otp}
    </div>
    <p style="margin-top:30px;color:#6b7280;">Valid for <strong>10 minutes</strong></p>
    <p style="color:#9ca3af;font-size:12px;">If you didn't request this, please ignore this email.</p>
  </div>`,
  };

  
  await transporter.sendMail(mailOptions);



};






