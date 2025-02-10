const twilio = require("twilio");
require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;  

const twilioPhone = "+1 667 249 9018";  // Your Twilio phone number

const client = twilio(accountSid, authToken);

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Format phone number to E.164 standard (i.e., +919876543210)
const formatPhoneNumber = (phone) => {
  if (!phone.startsWith("+")) {
    return `+91${phone}`;  // Default to India country code if not present
  }
  return phone;
};

// Send OTP via SMS
const sendOTP = async (phone, otp) => {
  try {
    // Format the phone number
    const formattedPhone = formatPhoneNumber(phone);
    console.log("Formatted phone number:", formattedPhone);  // Log the formatted phone number

    const message = await client.messages.create({
      body: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      from: twilioPhone,
      to: formattedPhone,  // Use formatted phone number here
    });
    console.log("OTP sent:", message.sid);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP.");
  }
};

module.exports = { generateOTP, sendOTP };
