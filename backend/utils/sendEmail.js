const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Check if SMTP environment variables exist
  const hasSmtpConfig = process.env.EMAIL_USER && (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD);

  if (hasSmtpConfig) {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `PilgrimIQ Support <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Password reset email successfully sent to ${options.email}`);
  } else {
    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL SENT TO: ${options.email}]`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.message}`);
    console.log(`Tip: Add EMAIL_USER and EMAIL_PASS to backend/.env for real SMTP emails.`);
    console.log(`======================================================\n`);
  }
};

module.exports = sendEmail;
