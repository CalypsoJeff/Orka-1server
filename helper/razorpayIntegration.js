const Razorpay = require('razorpay');
const Competition = require('../models/competitionModel');

// Initialize Razorpay instance (replace with your actual API keys)
const razorpayInstance = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID.env',
  key_secret: 'YOUR_RAZORPAY_KEY_SECRET.env',
});



module.exports = { createRazorpayOrder };