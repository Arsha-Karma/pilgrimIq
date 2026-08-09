const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

// Load .env explicitly from backend root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sendEmail = async (options) => {
  // Ensure .env is freshly loaded if process was started earlier
  dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

  const emailUser = process.env.EMAIL_USER || "pilgrimlq03@gmail.com";
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || "nanclkodweshkdjc";

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: false, // true for 465, false for 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: `PilgrimIQ Support <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    if (err.message.includes("534-5.7.9") || err.message.includes("Invalid login")) {
      console.error(
        `[EMAIL ERROR] Google SMTP Auth Failed (534-5.7.9) for ${emailUser}.\n` +
        `  -> Cause: Gmail requires an App Password when 2-Step Verification is enabled or password expired.\n` +
        `  -> Solution: Visit https://myaccount.google.com/apppasswords using ${emailUser}, generate a 16-character App Password, and update EMAIL_PASS in backend/.env.`
      );
    } else {
      console.error(`[EMAIL ERROR] Failed to send email to ${options.email}:`, err.message);
    }
    throw new Error(`Email delivery failed: ${err.message}`);
  }
};

module.exports = sendEmail;
