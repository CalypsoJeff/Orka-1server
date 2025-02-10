const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");




//controller for user registration and signin


// Registering User and Sending OTP
router.post("/register", userController.registerUser);
//  Verify OTP and Complete Registration
router.post("/verify-otp", userController.verifyOtpAndRegister);
// Resend OTP 
router.post("/resend-otp", userController.resendOtp);





router.get("/competitions", userController.loadCompetitionsPage);
router.get("/competition-Details", userController.loadCompetitionDetailsPage );


// Export the router
module.exports = router;