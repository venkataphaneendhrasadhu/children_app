const nodemailer = require("nodemailer");

async function sendOtpEmail(email, otpCode) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"FamilyPlate Nutrition" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${otpCode} is your FamilyPlate verification code`,
      html: `
        <div style="font-family: sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; border-radius: 16px; background: #0F172A; color: #F8FAFC;">
          <h2 style="color: #FF6B4A; margin-top: 0;">FamilyPlate Nutrition</h2>
          <p>Use the 6-digit verification code below to sign in with your email:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 16px 20px; background: #1E293B; border-radius: 12px; text-align: center; color: #38BDF8;">
            ${otpCode}
          </div>
          <p style="font-size: 13px; color: #94A3B8; margin-top: 16px;">Expires in 10 minutes.</p>
        </div>
      `,
    });
    return { deliveredVia: "smtp" };
  }

  console.log(`\n========================================`);
  console.log(`[EMAIL OTP] To: ${email} | Code: ${otpCode}`);
  console.log(`========================================\n`);
  return { deliveredVia: "console_and_dev_preview" };
}

module.exports = { sendOtpEmail };
