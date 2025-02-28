const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const multer = require("multer");

const storage = multer.memoryStorage();


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single("image"); // ✅ Accept only one image

const uploads = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB file limit
}).array("images",5);





router.post('/adminLogin', adminController.adminLogin);
router.post('/register', adminController.registerAdmin);
router.post('/verify-otp', adminController.verifyOtp);
router.post('/resend-otp', adminController.resendOTP);


//for competitions 
router.get('/competitions', adminController.loadCompetitionsPage);
router.post('/add-Competitions', uploads, adminController.addCompetition);
router.put('/edit-competition/:id', uploads, adminController.editCompetition);
router.delete('/delete-competition/:id', adminController.deleteCompetition);


// Routes for Trekking
router.get('/trekking', adminController.loadTrekkingPage);
router.post('/add-trekking',upload, adminController.addTrekking);
router.put('/edit-trekking/:id',upload, adminController.editTrekking);
router.delete('/delete-trekking/:id', adminController.deleteTrekking);



//routes for products
router.get('/products',adminController.loadProductsPage);
router.get('/add-product', adminController.loadAddProduct);
router.post('/add-product-category', adminController.addProductCategory);
router.get('/product-categories', adminController.getAllProductCategories);
router.put('/edit-product-categories/:categoryId',  adminController.editProductCategory);
router.put('/product/:productId/status',  adminController.changeProductStatus); 
router.patch('/product-categories-toggle/:categoryId/status',  adminController.toggleProductCategoryStatus);
router.post('/add-product', adminController.addProduct);
router.put('/edit-product/:id', adminController.editProduct);
router.delete('/delete-product/:id', adminController.deleteProduct);



//for users
router.get('/userController',adminController.getUsers);
router.patch('/user/block', adminController.blockUser);
router.patch('/user/unblock', adminController.unblockUser);



//for fitness
router.post('/add-fitness',  adminController.addFitness);
router.post('/add-fitness-category', adminController.addFitnessCategory);

module.exports = router;