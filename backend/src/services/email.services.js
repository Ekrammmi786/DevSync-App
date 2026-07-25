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
        html: `<h2>Your OTP: ${otp}</h2><p>Valid for 10 minutes</p>`,
    };
    await transporter.sendMail(mailOptions);
};


