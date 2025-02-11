const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");







router.post("/login", userController.loginUser);
router.post("/register", userController.registerUser);
router.post("/verify-otp", userController.verifyOtpAndRegister);
router.post("/resend-otp", userController.resendOtp);





router.get("/competitions", userController.loadCompetitionsPage);
router.get("/competition-Details", userController.loadCompetitionDetailsPage );


// Export the router
module.exports = router;