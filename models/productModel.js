const mongoose = require('mongoose');
const Category = require('./Category'); // Import the Category model

// Define the Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0, // Percentage discount, 0 means no discount
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Reference to Category model
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    sizes: [
      {
        size: {
          type: String,
          enum: ['S', 'M', 'L', 'XL', 'XXL', 'Custom'], // Example sizes
          required: true,
        },
        colors: [
          {
            color: {
              type: String,
              required: true,
            },
            stock: {
              type: Number,
              required: true,
              min: 0, // Stock cannot be negative
            },
          },
        ],
      },
    ],
    material: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String, // URL to image
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Assuming you have a User model
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
