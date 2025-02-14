const mongoose = require('mongoose');

// Define the Category Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        trim: true,
      },
    description: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create the Category model
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
