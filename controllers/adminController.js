const bcrypt = require('bcrypt');
const redis = require('../helper/redisClient').default;
const { sendEmailWithOTP, generateOTP } = require('../helper/nodeMailer');
const { generateResetToken, generateToken, validateResetToken } = require('../helper/jwtHelper');
const Admin = require('../models/adminModel');
const Trekking = require('../models/trekkingModel');  
const Competition = require('../models/competitionsModel');
const products = require('../models/productModel');
const productsCategory = require('../models/productCategory');
const Users = require('../models/UserModel');
const Fitness = require('../models/fitnessModel'); 
const FitnessCategory = require('../models/fitenssCategory'); 
const cron = require('node-cron');
const { uploadToS3 } = require('../helper/s3Uploader');









const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Admin not found. Please register first." });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid credentials. Please try again." });
    }

    // Generate JWT tokens
    const { token, refreshToken } = generateToken(admin.name, admin.email, "admin");

    // Send the response
    return res.status(200).json({
      message: "Login successful!",
      token,
      refreshToken,
      admin,
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({ error: "An error occurred during login. Please try again later." });
  }
};







// Register Admin and Send OTP
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    // Temporarily store admin data in Redis for verification later
    await redis.set(
      `tempAdmin:${email}`,
      JSON.stringify({ name, email, password }),
      "EX",
      600 // 10-minute expiration time for user data
    );

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis with expiration of 5 minutes
    await redis.set(`otp:${email}`, otp, "EX", 300);

    // Send OTP via email
    await sendEmailWithOTP(email, otp, password, name);

    return res.status(200).json({ message: "OTP sent to your email for verification." });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP and Create Admin
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Retrieve OTP from Redis
    const storedOtp = await redis.get(`otp:${email}`);
    console.log("Stored OTP from Redis:", storedOtp);

    // Retrieve user data from Redis
    const userData = await redis.get(`tempAdmin:${email}`);
    console.log("Retrieved userData:", userData);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (!userData) {
      return res.status(400).json({ error: "User data expired. Please register again." });
    }

    // Parse the user data from Redis
    let parsedData;
    try {
      parsedData = JSON.parse(userData);
    } catch (err) {
      console.error("Failed to parse userData:", err);
      return res.status(500).json({ error: "Invalid user data stored. Please register again." });
    }

    const { name, email: userEmail, password } = parsedData;
    console.log("Parsed Data:", name, userEmail, password);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const newAdmin = new Admin({ name, email: userEmail, password: hashedPassword });
    await newAdmin.save();

    // Remove OTP and temp user data from Redis after successful registration
    await redis.del(`otp:${email}`);
    await redis.del(`tempAdmin:${email}`);

    return res.status(201).json({ message: "Admin registered successfully", newAdmin });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  


  }}





// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required to resend OTP" });
    }

    // Check if the admin is already registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists. Cannot resend OTP." });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Store the new OTP in Redis with a 5-minute expiry
    await redis.setex(email, 300, otp);

    // Send the new OTP via email
    await sendEmailWithOTP(email, otp);

    return res.status(200).json({ message: "OTP has been resent to your email." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



const loadCompetitionsPage = async (req, res) => {
  try {
    // Fetch all competitions from the database
    const competitions = await Competition.find().sort({ date: -1 }); // Sorting by date (latest first)

    if (!competitions || competitions.length === 0) {
      return res.status(200).json({
        message: "No competitions found.",
        competitions: [],
      });
    }

    return res.status(200).json({
      message: "Competitions loaded successfully.",
      competitions,
    });
  } catch (error) {
    console.error("Error loading competitions:", error);
    return res.status(500).json({
      message: "Failed to load competitions.",
      error: error.message,
    });
  }
};



// Load the Add Competition Page
const loadAddCompetition = (req, res) => {
  try {
    return res.status(200).json({
      message: "Add competition page loaded successfully."
    });
  } catch (error) {
    console.error('Error loading Add Competition page:', error);
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};





const addCompetition = async (req, res) => {
  try {
    console.log("🔥 Raw Request Body:", req.body); // Log text fields
    console.log("🖼️ Received Images:", req.files); // Log uploaded images
    const {
      name,
      category,
      time,
      date,
      place,
      state,
      district,
      town,
      duration,
      type,
      cost,
      maxRegistrations,
      description,
      status,
    } = req.body;

    const files = req.files;
    const images = files?.images?.[0];
    if (!images) {
      console.error("Competition Image is missing.");
      return res
        .status(400)
        .json({ message: "Competition Image is required" });
    }
    const { Location } = await uploadToS3(images);
    console.log("🔥 Uploaded Image URL:", Location);

    // Create and save the new competition
    const competition = new Competition({
      name,
      category,
      image: Location,
      time,
      date,
      place,
      state,
      district,
      town,
      duration,
      type,
      cost,
      maxRegistrations,
      description,
      status: status || 'inactive',
    });
    await competition.save();
    return res.status(200).json({
      message: 'Competition added successfully.',
      competition,
    });
  } catch (error) {
    console.error('Error adding competition:', error);
    return res.status(500).json({
      message: 'Failed to add competition.',
      error: error.message,
    });
  }
};



const editCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      time,
      date,
      place,
      state,
      district,
      town,
      duration,
      type,
      cost,
      maxRegistrations,
      description,
      status,
    } = req.body;

    console.log("🔥 Raw Request Body:", req.body); // Log text fields
    console.log("🖼️ Received Images:", req.files); // Log uploaded images

    const files = req.files;
    const images = files?.images?.[0];
    if (!images) {
      console.error("Competition Image is missing.");
      return res
        .status(400)
        .json({ message: "Competition Image is required" });
    }
    const { Location } = await uploadToS3(images);
    console.log("🔥 Uploaded Image URL:", Location);


    // Fetch the competition to get existing details
    const existingCompetition = await Competition.findById(id);

    if (!existingCompetition) {
      return res.status(404).json({
        message: 'Competition not found.',
      });
    }

    const updatedCompetition = await Competition.findByIdAndUpdate(
      id,
      {
        name: name || existingCompetition.name,
        category: category || existingCompetition.category,
        image: Location || existingCompetition.image,
        time: time || existingCompetition.time,
        date: date || existingCompetition.date,
        place: place || existingCompetition.place,
        state: state || existingCompetition.state,
        district: district || existingCompetition.district,
        town: town || existingCompetition.town,
        duration: duration || existingCompetition.duration,
        type: type || existingCompetition.type,
        cost: cost || existingCompetition.cost,
        maxRegistrations: maxRegistrations || existingCompetition.maxRegistrations,
        description: description || existingCompetition.description,
        status: status || existingCompetition.status,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Competition updated successfully.',
      competition: updatedCompetition,
    });
  } catch (error) {
    console.error('Error editing competition:', error);
    return res.status(500).json({
      message: 'Failed to edit competition.',
      error: error.message,
    });
  }
};






const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({
        message: 'Competition not found.',
      });
    }

    return res.status(200).json({
      message: 'Competition deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting competition:', error);
    return res.status(500).json({
      message: 'Failed to delete competition.',
      error: error.message,
    });
  }
};




// Load Trekking Page
const loadTrekkingPage = async (req, res) => {
  try {
    const trekList = await Trekking.find().sort({ startDate: 1 });
    return res.status(200).json({
      message: trekList.length ? "Trekking events loaded successfully." : "No trekking events found.",
      trekList,
    });
  } catch (error) {
    console.error("Error loading trekking events:", error);
    return res.status(500).json({ message: "Failed to load trekking events.", error: error.message });
  }
};



// Load Add Trekking Page
const loadAddTrekking = (req, res) => {
  try {
    return res.status(200).json({ message: "Add trekking event page loaded successfully." });
  } catch (error) {
    console.error("Error loading Add Trekking page:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




const addTrekking = async (req, res) => {
  try {
    const { name, category, trekDistance, trekDuration, costPerPerson, startDate, difficulty, maxParticipants, place, state, district, description } = req.body;
    console.log("🔥 Raw Request Body:", req.body); // Log text fields
    console.log("🖼️ Received Images:", req.files); // Log uploaded images
    if (!req.file) {
      return res.status(400).json({ message: "Image is required." });
    }

    // ✅ Upload Image to S3
    const { Location } = await uploadToS3(req.file);
    console.log("🔥 Uploaded Image URL:", Location);

    const trekkingEvent = new Trekking({ name, category, image: Location, trekDistance, trekDuration, costPerPerson, startDate, difficulty, maxParticipants, place, state, district, description });
    await trekkingEvent.save();
    return res.status(200).json({ message: "Trekking event added successfully.", trekkingEvent });
  } catch (error) {
    console.error("Error adding trekking event:", error);
    return res.status(500).json({ message: "Failed to add trekking event.", error: error.message });
  }
};



const loadEditTrekking = async (req, res) => {
  try {
    const { id } = req.params;
    const trekkingEvent = await Trekking.findById(id);
    if (!trekkingEvent) {
      return res.status(404).json({ message: "Trekking event not found." });
    }
    return res.status(200).json({ message: "Trekking event fetched successfully.", trekkingEvent });
  } catch (error) {
    console.error("Error fetching trekking event:", error);
    return res.status(500).json({ message: "Failed to fetch trekking event.", error: error.message });
  }
};



const editTrekking = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, image, trekDistance, trekDuration, costPerPerson, startDate, difficulty, maxParticipants, place, state, district, description } = req.body;
    console.log("🔥 ID", id); 
    console.log("🔥 Raw Request Body:", req.body); 
    console.log("🖼️ Received Images:", req.files); 
    const updatedTrekking = await Trekking.findByIdAndUpdate(id, { name, category, image, trekDistance, trekDuration, costPerPerson, startDate, difficulty, maxParticipants, place, state, district, description }, { new: true, runValidators: true });
    if (!updatedTrekking) {
      return res.status(404).json({ message: "Trekking event not found." });
    }
    return res.status(200).json({ message: "Trekking event updated successfully.", trekkingEvent: updatedTrekking });
  } catch (error) {
    console.error("Error editing trekking event:", error);
    return res.status(500).json({ message: "Failed to edit trekking event.", error: error.message });
  }
};

// Delete Trekking Event
const deleteTrekking = async (req, res) => {
  try {
    const { id } = req.params;
    const trekkingEvent = await Trekking.findByIdAndDelete(id);
    if (!trekkingEvent) {
      return res.status(404).json({ message: "Trekking event not found." });
    }
    return res.status(200).json({ message: "Trekking event deleted successfully." });
  } catch (error) {
    console.error("Error deleting trekking event:", error);
    return res.status(500).json({ message: "Failed to delete trekking event.", error: error.message });
  }
};





// Controller to add a new category
const addProductCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category with the same name already exists
    const existingCategory = await  productsCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    // Create a new category instance
    const newCategory = new productsCategory({
      name,
      description,
    });

    // Save the category to the database
    const savedCategory = await newCategory.save();
    res.status(201).json({ message: 'Category added successfully', category: savedCategory });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Failed to add category', error: error.message });
  }
};


// Controller to list all categories
const getAllProductCategories = async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await productsCategory .find();

    res.status(200).json({ message: 'Categories fetched successfully', categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};





// Controller to edit an existing category
const editProductCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // Check if the category exists
    const category = await productsCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Check if the new name already exists
    const existingCategory = await productsCategory.findOne({ name });
    if (existingCategory && existingCategory._id.toString() !== categoryId) {
      return res.status(400).json({ message: 'Category name already exists.' });
    }

    // Update the category
    category.name = name || category.name;
    category.description = description || category.description;

    // Save the updated category
    const updatedCategory = await category.save();

    res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    console.error('Error editing category:', error);
    res.status(500).json({ message: 'Failed to edit category', error: error.message });
  }
};




// Controller to change the status (list/unlist) of a category
const toggleProductCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Find the category by ID
    const category = await productsCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Toggle the status between 'active' and 'inactive'
    category.status = category.status === 'active' ? 'inactive' : 'active';

    // Save the updated category status
    const updatedCategory = await category.save();

    res.status(200).json({ message: 'Category status updated successfully', category: updatedCategory });
  } catch (error) {
    console.error('Error toggling category status:', error);
    res.status(500).json({ message: 'Failed to update category status', error: error.message });
  }
};





const loadProductsPage = async (req, res) => {
  try {
    // Fetch all products from the database, sorted by creation date (newest first)
    const Products = await products.find().sort({ createdAt: -1 }).populate("category","name");

    if (!Products || Products.length === 0) {
      return res.status(200).json({
        message: "No products found.",
        Products: [],
      });
    }

    return res.status(200).json({
      message: "Products loaded successfully.",
      Products ,
    });
  } catch (error) {
    console.error("Error loading products:", error);
    return res.status(500).json({
      message: "Failed to load products.",
      error: error.message,
    });
  }
};



const loadAddProduct = (req, res) => {
  try {
    return res.status(200).json({
      message: "Add product page loaded successfully."
    });
  } catch (error) {
    console.error('Error loading Add Product page:', error);
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};



const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      category,
      brand,
      sizes,
      material,
      rating,
    } = req.body;

    console.log("🔥 Raw Request Body:", req.body);
    console.log("🖼️ Received Images:", req.files);

    // ✅ Parse sizes if it's sent as a string
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch (error) {
      return res.status(400).json({ message: "Invalid sizes format." });
    }

    // ✅ Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category reference." });
    }

    // ✅ Upload images to S3 (Handling multiple images properly)
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        const { Location } = await uploadToS3(file);
        return Location;
      })
    );

    console.log("🔥 Uploaded Image URLs:", uploadedImages);

    // ✅ Create and save the new product
    const product = new Product({
      name,
      description,
      price,
      discount: discount || 0,
      category,
      brand,
      sizes: parsedSizes, // ✅ Correctly saving parsed array
      material,
      images: uploadedImages, // ✅ Store array of image URLs
      rating: rating || 0,
    });

    await product.save();

    return res.status(200).json({
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("❌ Error adding product:", error);
    return res.status(500).json({
      message: "Failed to add product.",
      error: error.message,
    });
  }
};




const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('req.body:', req.body);
    console.log('sssss',id)

    const {
      name,
      description,
      price,
      discount,
      category, // Category should be an ObjectId
      brand,
      sizes, // Sizes array with colors and stock quantities
      material,
      images,
      rating,
    } = req.body;

    // Fetch the product to get existing details
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return res.status(404).json({
        message: 'Product not found.',
      });
    }


    // ✅ Parse sizes if it's sent as a string
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch (error) {
      return res.status(400).json({ message: "Invalid sizes format." });
    }

    // Validate the category reference if it's provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category reference.' });
      }
    }

    // Update the product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        price: price || existingProduct.price,
        discount: discount || existingProduct.discount,
        category: category || existingProduct.category,
        brand: brand || existingProduct.brand,
        sizes: parsedSizes || existingProduct.sizes, // Sizes will be updated as well
        material: material || existingProduct.material,
        images: images || existingProduct.images,
        rating: rating || existingProduct.rating,
      },
      { new: true, runValidators: true } // Return updated document and apply validation
    );

    return res.status(200).json({
      message: 'Product updated successfully.',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error editing product:', error);
    return res.status(500).json({
      message: 'Failed to edit product.',
      error: error.message,
    });
  }
};






const changeProductStatus = async (req, res) => {
  console.log('🔥 Request Params:', req.params);

  try {
    const { productId } = req.params; // Extract product ID from URL parameters

    // Find the product by ID
    const product = await products.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Reverse the current status (toggle between 'active' and 'inactive')
    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    // Update the product with the new status
    const updatedProduct = await products.findByIdAndUpdate(
      productId,
      { status: newStatus },
      { new: true, runValidators: true } // Ensures the updated document is returned
    );

    // Send response with updated product details
    res.status(200).json({
      message: `Product status changed to ${newStatus}`,
      product: updatedProduct,
    });

  } catch (error) {
    console.error('❌ Error changing product status:', error);
    res.status(500).json({ message: 'Failed to change product status', error: error.message });
  }
};





const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await products.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.',
      });
    }

    return res.status(200).json({
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      message: 'Failed to delete product.',
      error: error.message,
    });
  }
};






const getUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await Users.find({}).select('name email phone status'); // Select only the necessary fields

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: 'No users found.',
      });
    }

    return res.status(200).json({
      message: 'Users fetched successfully.',
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      message: 'Failed to fetch users.',
      error: error.message,
    });
  }
};




const blockUser = async (req, res) => {
  try {
    const { phone} = req.body;

    // Find the user by email
    const user = await  Users.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Check if the user is already banned
    if (user.status === 'Banned') {
      return res.status(400).json({
        message: 'User is already banned.',
      });
    }

    // Update the user's status to 'Banned'
    user.status = 'Banned';

    // Save the updated user status
    await user.save();

    return res.status(200).json({
      message: 'User blocked (banned) successfully.',
      user,
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    return res.status(500).json({
      message: 'Failed to block user.',
      error: error.message,
    });
  }
};




const unblockUser = async (req, res) => {
  try {
    const {phone } = req.body;

    // Find the user by email
    const user = await  Users.findOne({phone });

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    // Check if the user is already active
    if (user.status === 'Active') {
      return res.status(400).json({
        message: 'User is already active.',
      });
    }

    // Update the user's status to 'Active'
    user.status = 'Active';

    // Save the updated user status
    await user.save();

    return res.status(200).json({
      message: 'User unblocked (activated) successfully.',
      user,
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return res.status(500).json({
      message: 'Failed to unblock user.',
      error: error.message,
    });
  }
};







const  addFitness = async (req, res) => {
  console.log("Entering add fitness");

  // Ensure video files are uploaded for each workout
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Each workout must have an animated video.' });
  }

  try {
    const {
      name,
      description,
      categories, 
      difficulty,
      duration,
      workouts, 
      equipment,
      targetMuscles,
      caloriesBurned,
    } = req.body;



  // Validate that workouts are provided and in the correct format
  if (!workouts || workouts.length === 0) {
    return res.status(400).json({ message: 'At least one workout must be added.' });
  }

  // Ensure categories array is not empty
  if (!categories || categories.length === 0) {
    return res.status(400).json({ message: 'At least one category must be selected.' });
  }

  // Fetch the category by ID (ensure the category exists)
  const category = await FitnessCategory.findById(categories[0]); // Assuming single category for simplicity
  if (!category) {
    return res.status(400).json({ message: 'Invalid category selected.' });
  }

  // Check if a fitness model with the same name already exists in the selected category
  const existingFitness = await Fitness.findOne({
    name: name.trim(),
    categories: categories[0], // Match by category ID
  });

  if (existingFitness) {
    return res.status(400).json({ message: 'A fitness exercise with this name already exists in this category.' });
  }

  // Format the workouts array
  const formattedWorkouts = workouts.map((workout) => ({
    name: workout.name,
    restTime: workout.restTime,
     videoUrl: req.files[index].location, // If you re-enable file uploads
  }));


    // Create and save the new fitness exercise
    const fitness = new Fitness({
      name,
      description,
      categories,
      difficulty,
      duration,
      workouts: formattedWorkouts,
      equipment,
      targetMuscles,
      caloriesBurned: caloriesBurned || null,
    });

    // Save the fitness exercise to the database
    await fitness.save();

    return res.status(200).json({
      message: 'Fitness exercise added successfully.',
      fitness,
    });
  } catch (error) {
    console.error('Error adding fitness exercise:', error);
    return res.status(500).json({
      message: 'Failed to add fitness exercise.',
      error: error.message,
    });
  }
};






// Controller to add a new fitness category
const addFitnessCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if the category name is provided
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    // Check if the category already exists
    const existingCategory = await FitnessCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists.' });
    }

    // Create a new fitness category
    const newCategory = new FitnessCategory({
      name: name.trim(),
    });

    // Save the category to the database
    await newCategory.save();

    return res.status(201).json({
      message: 'Fitness category added successfully.',
      category: newCategory,
    });
  } catch (error) {
    console.error('Error adding fitness category:', error);
    return res.status(500).json({
      message: 'Failed to add fitness category.',
      error: error.message,
    });
  }
};




module.exports = {
  adminLogin,
  registerAdmin,
  verifyOtp,
  resendOTP,
  loadCompetitionsPage,
  loadAddCompetition,
  addCompetition,
  editCompetition,
  deleteCompetition,
  loadTrekkingPage,
  loadAddTrekking,
  addTrekking,
  loadEditTrekking,
  editTrekking,
  deleteTrekking,
  addProductCategory,
  getAllProductCategories,
 editProductCategory,
 toggleProductCategoryStatus ,
  loadProductsPage,
  loadAddProduct,
  addProduct,
  editProduct,
  changeProductStatus,
  deleteProduct,
  getUsers,
  blockUser,
  unblockUser,
  addFitnessCategory,
  addFitness

};
