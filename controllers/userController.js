const bcrypt = require('bcrypt');
const redis = require("../helper/redisClient").default;
const { generateOTP, sendOTP } = require("../helper/twiloOtp");
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const { OAuth2Client } = require("google-auth-library");
const Competition = require('../models/competitionsModel');
const Order = require('../models/orderSchema');
const Trekking = require('../models/trekkingModel');
const BikeRide = require('../models/ridersModel'); 
const products = require('../models/productModel');
const { generateResetToken, generateToken, validateResetToken } = require('../helper/jwtHelper');
const { log } = require('node:console');
const session = require('express-session');
const Razorpay = require('razorpay');







const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});




const loginUser = async (req, res) => {
  try {
    console.log("user login started");
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required." }); // Corrected error message
    }

    // Find the user by phone and select the password
    const user = await User.findOne({ phone }).select('+password'); // Select password explicitly

    if (!user) {
      return res.status(400).json({ error: "User not found. Please register first." });
    }

    // Check if the user is banned
    if (user.status === 'Banned') {
      return res.status(403).json({
        message: 'Your account is banned. Please contact support.',
      });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid credentials. Please try again." });
    }

    // Generate JWT tokens
    const { token, refreshToken } = generateToken(user.name, user.phone, "user");
    console.log("user login done");

    // Send the response
    res.status(200).json({
      message: "Login successful!",
      token,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An error occurred during login. Please try again later." });
  }
};



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


    if (existingUser) {
      if (existingUser.status === 'Banned') {
        return res.status(400).json({
          message: 'This email or phone number is banned and cannot be used to register.',
        });
      }
    }


    const otp = generateOTP();


    // Correctly set OTP with expiration time (300 seconds = 5 minutes)
    const otpResult = await redis.set(`otp:${phone}`, otp, 'EX', 300);
    console.log("OTP set successfully in Redis:", otpResult);

    // Send OTP via SMS (you may want to check here that the SMS was successfully sent)
    await sendOTP(phone, otp);
console.log("pass akuo");

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












const loadHomePage = async (req, res) => {
  try {
    // Get logged-in user details from the request (assuming token is validated elsewhere)
    const user = req.user;  // Assuming user is attached to the request after token verification

    if (!user) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    // Fetch all products, sorted by creation date (latest first)
    const allProducts = await products.find().sort({ createdAt: -1 });

    // Fetch all competitions, sorted by creation date (latest first)
    const allCompetitions = await competitions.find().sort({ createdAt: -1 });

    // Send the response with products, competitions, and logged-in user details
    res.status(200).json({
      message: 'Welcome to the Home Page!',
      user,
      products: allProducts,
      competitions: allCompetitions,
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).json({ error: 'An error occurred while loading the home page.' });
  }
};






const getUserDetails = async (req, res) => {
  try {
    // const userId = "67c07e6957b6f7fe5e48d918"; 
 
    const userId = new mongoose.Types.ObjectId("67c07e6957b6f7fe5e48d918");

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID not found.' });
    }

    // Find the user without populating initially
    const user = await User.findById(userId);
    console.log(user,"ith antha ");
    

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Populate only if the user has related data
    if (user.orders && user.orders.length > 0) {
      await user.populate('orders');
    }

    if (user.registeredCompetitions && user.registeredCompetitions.length > 0) {
      await user.populate('registeredCompetitions.competitionId');
    }

    if (user.registeredTrekkingEvents && user.registeredTrekkingEvents.length > 0) {
      await user.populate('registeredTrekkingEvents.trekkingId');
    }

    if (user.registeredBikeRides && user.registeredBikeRides.length > 0) {
      await user.populate('registeredBikeRides.rideId');
    }

    // Send the user details in the response
    res.status(200).json({
      message: 'User details retrieved successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        address: user.address,
        orders: user.orders || [], // Ensure orders is always an array
        registeredCompetitions: user.registeredCompetitions || [],
        registeredTrekkingEvents: user.registeredTrekkingEvents || [],
        registeredBikeRides: user.registeredBikeRides || [],
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error retrieving user details:', error);
    res.status(500).json({ error: 'Internal server error.' });
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



const registerForCompetition = async (req, res) => {
  try {
    const { competitionId, name, email, phone } = req.body;
    const userId = req.user.userId; 

    if (!competitionId || !name || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Find the competition
    const competition = await Competition.findById(competitionId);
    if (!competition || competition.status !== 'active') {
      return res.status(404).json({ error: 'Competition not found or inactive.' });
    }

   // Check if the user is already registered for this competition (using findOne)
   const existingRegistration = await User.findOne({ 
    _id: userId, 
    'registeredCompetitions.competitionId': competitionId 
  });

  if (existingRegistration) {
    return res.status(400).json({ error: 'You are already registered for this competition.' });
  }

    // Pass registration details to the next step (showPaymentConfirmation)
    req.session.registrationDetails = {
      competitionId,
      name,
      email,
      phone,
      userId: userId 
    };


    // Set timeout to delete session after 5 minutes
    setTimeout(() => {
      req.session.destroy();
    }, 10 * 60 * 1000);

    return res.status(200).json({
      message: 'Registration details passed to payment confirmation.',
      competition,
    
    });
  } catch (error) {
    console.error('Error during competition registration:', error);
    res.status(500).json({ error: 'An error occurred during registration.' });
  }
};




const showPaymentConfirmation = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const registrationDetails = req.session.registrationDetails;
console.log( registrationDetails);

    // Check if registration details are available in the session
    if (!registrationDetails) {
      return res.status(400).json({ error: 'Registration details not found in session.' });
    }

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found.' });
    }

    // Send details to the front end to show before payment
    return res.status(200).json({
      message: 'Payment confirmation details.',
      competition,
      cost: competition.cost,
      registrationDetails // Include registration details from session
    });
  } catch (error) {
    console.error('Error showing payment confirmation:', error);
    res.status(500).json({ error: 'An error occurred while showing payment confirmation.' });
  }
};




const createRazorpayCompetition = async (req, res) => {
  try {
    const { competitionId } = req.body;
    const registrationDetails = req.session.registrationDetails; // Get registration details
    console.log( registrationDetails);


  

    // Verify Competition ID
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found.' });
    }
    const amount =competition.cost;
 
    // Create Razorpay order with registration details
    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${new Date().getTime()}`,
      metadata: { // Include registration details in metadata
        competitionId: competitionId,
        userId: registrationDetails.userId, 
        name: registrationDetails.name,
        email: registrationDetails.email,
        phone: registrationDetails.phone,
      }
    };

    razorpayInstance.orders.create(options, async(err, order) => {
      if (err) {
        console.error('Error creating Razorpay order:', err);
        return res.status(500).json({ error: 'Failed to create Razorpay order.' });
      }
    
      // Payment successful (this part is hypothetical, you'll need to handle actual payment verification)
      if (order.status === 'paid') { // Assuming 'paid' is the successful status
        try {
          // 1. Update User Model
          await User.findByIdAndUpdate(
            registrationDetails.userId,
            { $push: { registeredCompetitions: { competitionId: competitionId } } },
            { new: true }
          );
    
          // 2. Update Competition Model
          await Competition.findByIdAndUpdate(
            competitionId,
            {
              $push: {
                registeredParticipants: {
                  name: registrationDetails.name,
                  email: registrationDetails.email,
                  phone: registrationDetails.phone,
                },
              },
            },
            { new: true }
          );
    
          // 3. Destroy Session
          req.session.destroy();
    
          return res.status(200).json({
            message: 'Order created successfully.',
            order,
          });
        } catch (error) {
          console.error('Error updating user or competition:', error);
          return res.status(500).json({ error: 'Failed to update user or competition.' });
        }
      } else {
        return res.status(200).json({ //This return was originally inside the If statement, Moved outside.
          message: 'Order created successfully.',
          order,
        });
      }
    });
      
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};



const loadProducts = async (req, res) => {
  try {
    const allProducts = await products.find().sort({ createdAt: -1 }).limit(3);
    return res.status(200).json({
      message: "Products loaded successfully",
      products: allProducts
    });
  } catch (error) {
    console.error('Error loading products:', error);
    return null;
  }
}

const loadShopProducts = async (req, res) => {
  try {
    const allProducts = await products.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Products loaded successfully",
      products: allProducts
    });
  } catch (error) {
    console.error('Error loading products:', error);
    return null;
  }
}
const loadProductDetails = async (req, res) => {
  try {

    const { id } = req.params;
    console.log("product details started", id);

    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found.',
      });
    }
    return res.status(200).json({
      message: 'Product details loaded successfully.',
      product,
    });
  } catch (error) {
    console.error('Error loading product details:', error);
    return res.status(500).json({
      message: 'An error occurred while loading product details.',
      error: error.message,
    });
  }
}

const loadTrekking = async (req, res) => {
  try {
    const allTrekking = await Trekking.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Trekking loaded successfully",
      trekking: allTrekking
    });
  } catch (error) {
    console.error('Error loading trekking:', error);
    return null;
  }
}


module.exports = {
  loginUser ,
  registerUser,
  verifyOtpAndRegister,
  resendOtp,
  loadHomePage,
  getUserDetails,
  loadCompetitionsPage,
  loadCompetitionDetailsPage,
  registerForCompetition ,
  showPaymentConfirmation,
  createRazorpayCompetition,
  loadProducts,
  loadProductDetails,
  loadShopProducts,
  loadTrekking,
  
};
