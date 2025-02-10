const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

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


module.exports = router;