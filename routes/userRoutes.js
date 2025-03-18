const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");







router.post("/login", userController.loginUser);
router.post("/register", userController.registerUser);
router.post("/verify-otp", userController.verifyOtpAndRegister);
router.post("/resend-otp", userController.resendOtp);
router.get('/user-details', userController.getUserDetails);





router.get("/competitions", userController.loadCompetitionsPage);
router.get("/competition-Details/:competitionId", userController.loadCompetitionDetailsPage );
router.post('/registerForCompetition',  userController.registerForCompetition);
router.get('/showPaymentConfirmation/:competitionId',  userController.showPaymentConfirmation);
router.post('/create-order', userController.createRazorpayCompetition);


// PRODUCTS ROUTES
router.get("/products", userController.loadProducts);
router.get("/shop-products", userController.loadShopProducts);
router.get("/products/:id", userController.loadProductDetails);



//TREKKING ROUTES
router.get("/trekkings", userController.loadTrekking);

// Export the router
module.exports = router;