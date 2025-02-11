const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");




router.post('/adminLogin', adminController.adminLogin);
router.post('/register', adminController.registerAdmin);
router.post('/verify-otp', adminController.verifyOtp);
router.post('/resend-otp', adminController.resendOTP);


//for competitions 
router.put('/competitions', adminController.loadCompetitionsPage);
router.post('/add-Competitions', adminController.addCompetition);
router.get('/edit-competition/:id', adminController.loadEditCompetition);
router.put('/edit-competition/:id', adminController.editCompetition);
router.delete('/delete-competition/:id', adminController.deleteCompetition);


// Routes for Trekking
router.get('/trekking', adminController.loadTrekkingPage);
router.post('/add-trekking', adminController.addTrekking);
router.get('/edit-trekking/:id', adminController.loadEditTrekking);
router.put('/edit-trekking/:id', adminController.editTrekking);
router.delete('/delete-trekking/:id', adminController.deleteTrekking);



//routes for products
router.get('/products',adminController.loadProductsPage);
router.get('/add-product', adminController.loadAddProduct);
router.post('/add-product', adminController.addProduct);
router.get('/edit-product/:id', adminController.loadEditProduct);
router.put('/edit-product/:id', adminController.editProduct);
router.delete('/delete-product/:id', adminController.deleteProduct);
module.exports = router;