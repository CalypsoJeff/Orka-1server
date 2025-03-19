const mongoose = require('mongoose');

const bikeRideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value >= new Date(), // Ensures date is not in the past
      message: 'Date must be today or a future date.'
    }
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value), // Validates time format HH:MM
      message: 'Start time must be in HH:MM format.'
    }
  },
  startPoint: {
    type: String,
    required: true,
    trim: true
  },
  endPoint: {
    type: String,
    required: true,
    trim: true
  },
  distance: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 0,
      message: 'Distance must be a positive number.'
    }
  },
  duration: {
    type: Number,
    required: true, // In hours
    validate: {
      validator: (value) => value > 0,
      message: 'Duration must be a positive number.'
    }
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Moderate', 'Hard'], // Dropdown values for difficulty level
    message: 'Difficulty must be one of Easy, Moderate, or Hard.'
  },
  cost: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value >= 0,
      message: 'Cost must be a non-negative number.'
    }
  },
  maxParticipants: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 0,
      message: 'Max participants must be a positive number.'
    }
  },
  registeredParticipants: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        registrationDate: { type: Date, default: Date.now }
      }
    ],
    validate: {
      validator: function (value) {
        return value.length <= this.maxParticipants; // Ensure participants do not exceed max allowed
      },
      message: 'Number of registered participants cannot exceed the maximum allowed.'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    message: 'Description must not exceed 500 characters.'
  }
}, { timestamps: true });

module.exports = mongoose.model('BikeRide', bikeRideSchema);
