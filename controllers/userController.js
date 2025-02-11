const bcrypt = require('bcrypt');
const redis = require("../helper/redisClient").default;
const jwt = require("jsonwebtoken");
const { generateOTP, sendOTP } = require("../helper/twiloOtp");
const User = require('../models/UserModel');
const { OAuth2Client } = require("google-auth-library");
const Competition = require('../models/competitionsModel');
const { generateResetToken, generateToken, validateResetToken } = require('../helper/jwtHelper');
const { log } = require('node:console');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);








// Register User and Send OTP
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All required fields must be filled." }); 
    }

    // Check if the email or phone number is already registered
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: "Email or Mobile Number already registered." });
    }

    const otp = generateOTP();

    // Correctly set OTP with expiration time (300 seconds = 5 minutes)
    const otpResult = await redis.set(`otp:${phone}`, otp, 'EX', 300);
    console.log("OTP set successfully in Redis:", otpResult);

    // Send OTP via SMS (you may want to check here that the SMS was successfully sent)
    await sendOTP(phone, otp);

    // Temporarily store user data in Redis for verification later
    const userDataResult = await redis.set(
      `tempUser:${phone}`,
      JSON.stringify({ name, email, password, phone }),
      "EX",
      600 // 10-minute expiration time for user data
    );
    console.log("User data set successfully in Redis:", userDataResult);

    // Send response to client
    return res.status(200).json({
      message: "OTP sent successfully. Please verify to complete registration.",
    }); // Return immediately after sending the response

  } catch (error) {
    console.error("Error during user registration:", error);
    return res.status(500).json({ error: "An error occurred during registration. Please try again later." }); // Ensure response is sent only once
  }
};





const verifyOtpAndRegister = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate input
    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required." });
    }

    // Retrieve the OTP from Redis
    const storedOtp = await redis.get(`otp:${phone}`);
    console.log("Stored OTP from Redis:", storedOtp);

    if (!storedOtp) {
      console.log(`No OTP found for phone number: ${phone}`);
      return res.status(400).json({ error: "OTP expired or not found. Please request a new OTP." });
    }

    // Verify the OTP
    if (storedOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please try again." });
    }

    // Retrieve user details from Redis
    const userData = await redis.get(`tempUser:${phone}`);
    console.log("Retrieved userData from Redis:", userData); // Debug log

    if (!userData) {
      return res.status(400).json({ error: "User data expired. Please register again." });
    }

    // Parse the userData
    let parsedData;
    try {
      parsedData = JSON.parse(userData);
    } catch (err) {
      console.error("Failed to parse userData:", err);
      return res.status(500).json({ error: "Invalid user data stored. Please register again." });
    }

    const { name, email, password } = parsedData;
    console.log("Parsed Data:", name, email, password);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
    });
    await newUser.save();

    // Generate JWT tokens
    const { token, refreshToken } = generateToken(name, email, "user");

    // Clean up Redis
    await redis.del(`otp:${phone}`);
    await redis.del(`tempUser:${phone}`);

    res.status(201).json({
      message: "Registration successful! Redirecting to home page.",
      token,
      refreshToken,
      newUser,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP. Please try again later." });
  }
};








// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    // Check if user data exists in Redis
    const userData = await redis.get(`tempUser:${phone}`);
    if (!userData) {
      return res.status(400).json({ error: "User data expired. Please register again." });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Update OTP in Redis
    await redis.set(`otp:${phone}`, otp, "EX", 600);

    // Send OTP via SMS
    await sendOTP(phone, otp);

    res.status(200).json({ message: "OTP resent successfully." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ error: "Failed to resend OTP. Please try again later." });
  }
};






const loadLoginPage = (req, res) => {
  try {
    res.status(200).json({ message: 'Welcome to the Login Page!' });
  } catch (error) {
    console.error('Error loading login page:', error);
    res.status(500).json({ error: 'An error occurred while loading the login page.' });
  }
};







const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("@@@@@@@@@@@@@@@", req.body)

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required.' });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Set the user in the session (or use JWT for token-based authentication)
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Respond with success
    res.status(200).json({ message: 'Login successful!', user: req.session.user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login. Please try again later.' });
  }
};








const loadHomePage = (req, res) => {
  try {
    res.status(200).json({ message: 'Welcome to the Home Page!' });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).json({ error: 'An error occurred while loading the home page.' });
  }
};





const loadCompetitionsPage = async (req, res) => {
  try {
    // Fetch all active competitions from the database, sorted by date (latest first)
    const competitions = await Competition.find({ status: 'active' }).sort({ date: -1 });

    if (!competitions || competitions.length === 0) {
      return res.status(200).json({
        message: 'No competitions available at the moment.',
        competitions: [],
      });
    }

    return res.status(200).json({
      message: 'Competitions loaded successfully.',
      competitions,
    });
  } catch (error) {
    console.error('Error loading competitions page:', error);
    return res.status(500).json({
      message: 'An error occurred while loading competitions.',
      error: error.message,
    });
  }
};



const loadCompetitionDetailsPage = async (req, res) => {
  try {
    const { competitionId } = req.params; // Get competition ID from URL parameters

    // Fetch the competition details based on the provided ID
    const competition = await Competition.findById(competitionId);

    if (!competition) {
      return res.status(404).json({
        message: 'Competition not found.',
      });
    }

    return res.status(200).json({
      message: 'Competition details loaded successfully.',
      competition,
    });
  } catch (error) {
    console.error('Error loading competition details:', error);
    return res.status(500).json({
      message: 'An error occurred while loading competition details.',
      error: error.message,
    });
  }
};







module.exports = {
  registerUser,
  verifyOtpAndRegister,
  resendOtp,
  loadLoginPage,
  login,
  loadHomePage,
  loadCompetitionsPage,
  loadCompetitionDetailsPage
};
