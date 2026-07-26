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
<div style="
    background:#eef2f7;
    padding:50px 20px;
    font-family:Arial,Helvetica,sans-serif;
">

    <div style="
        max-width:500px;
        margin:auto;
        background:#eef2f7;
        border-radius:25px;
        padding:40px;
        text-align:center;

        box-shadow:
            12px 12px 24px #cfd5df,
            -12px -12px 24px #ffffff;
    ">

        <h2 style="
            color:#1e3a8a;
            margin-bottom:25px;
        ">
            Verify Your Email
        </h2>

        <div style="
            display:inline-block;
            padding:18px 45px;
            border-radius:18px;
            background:#eef2f7;
            color:#2563eb;
            font-size:34px;
            font-weight:bold;
            letter-spacing:8px;

            box-shadow:
                inset 6px 6px 12px #cfd5df,
                inset -6px -6px 12px #ffffff,
                6px 6px 15px rgba(0,0,0,.08),
                -6px -6px 15px rgba(255,255,255,.9);
        ">
            ${otp}
        </div>

        <p style="
            margin-top:30px;
            color:#6b7280;
        ">
            Valid for <strong>10 minutes</strong>
        </p>

    </div>
</div>

`,
    };
    await transporter.sendMail(mailOptions);
};
