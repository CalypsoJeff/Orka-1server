const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Use 465 for SSL
  secure: true, // Secure connection for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("Error setting up transporter:", error);
  } else {
    console.log("Transporter is ready to send emails.");
  }
});

// Function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
};

// Function to send OTP
const sendEmailWithOTP = async (to, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to, // Recipient address
      subject: "Admin Registration OTP Verification",
      html: `<h3>Your OTP for admin registration is:</h3><h2>${otp}</h2><p>This OTP is valid for 5 minutes.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmailWithOTP, generateOTP };
