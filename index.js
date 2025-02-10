const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const dotenv =require("dotenv")
const database = require('./config/DB');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5174",  // Allow requests from your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  // Allowed HTTP methods
  credentials: true,  // Allow cookies and session data to be sent
}));



// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "your_secret_key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

// Routes
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Serve React front-end
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


database.dbConnect();
