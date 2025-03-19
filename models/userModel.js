const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format.'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Password will not be returned in queries unless explicitly selected
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => /^[0-9]{10}$/.test(value),
      message: 'Phone number must be a 10-digit number.'
    }
  },
  profilePicture: {
    type: String, // URL of the profile picture
    trim: true,
    default: 'default-profile.png' // Default profile picture
  },
  // dob: {
  //   type: Date,
  //   validate: {
  //     validator: (value) => value < new Date(),
  //     message: 'Date of birth must be a past date.'
  //   }
  // },

  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true },
    postalCode: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => /^[0-9]{5,6}$/.test(value),
        message: 'Postal code must be 5-6 digits.'
      }
    }
  },


  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Banned'],
    default: 'Active'
  }, 
  createdAt: {
    type: Date,
    default: Date.now
  },
  orders: [  
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order' // Assuming you have an 'Order' model
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
