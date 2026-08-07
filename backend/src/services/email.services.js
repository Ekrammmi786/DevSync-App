import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "DevSync - Email Verification",
        html: `
<div styl<div style="
    max-width:500px;
    margin:auto;
    background:#f8f9f5;
    border-radius:25px;
    padding:40px;
    text-align:center;

    box-shadow:
        12px 12px 24px #d9ddd2,
        -12px -12px 24px #ffffff;
">

    <h2 style="
        color:#556B2F;
        margin-bottom:25px;
    ">
        Verify Your Email on DevSync
    </h2>

    <div style="
        display:inline-block;
        padding:18px 45px;
        border-radius:18px;
        background:#f8f9f5;
        color:#6B7F32;
        font-size:34px;
        font-weight:bold;
        letter-spacing:8px;

        box-shadow:
            inset 6px 6px 12px #d9ddd2,
            inset -6px -6px 12px #ffffff,
            6px 6px 15px rgba(0,0,0,.08),
            -6px -6px 15px rgba(255,255,255,.9);
    ">
        ${otp}
    </div>

    <p style="
        margin-top:30px;
        color:#73786b;
    ">
        Valid for <strong style="color:#556B2F;">10 minutes</strong>
    </p>

</div>
`,
    };
    await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, otp) => {
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
