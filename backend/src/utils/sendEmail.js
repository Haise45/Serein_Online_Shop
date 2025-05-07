const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "465", 10),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Sử dụng App Password ở đây
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM_ADDRESS,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
    ...(options.replyTo && { replyTo: options.replyTo })
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email} via Gmail`);
  } catch (error) {
    console.error(`Error sending email via Gmail to ${options.email}:`, error);
    throw new Error("Có lỗi xảy ra khi gửi email, vui lòng thử lại sau.");
  }
};

module.exports = sendEmail;
