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
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    }
  },
  { timestamps: true }
);

// Create the Category model
const productCategory = mongoose.model('Category', categorySchema);

module.exports = productCategory;
