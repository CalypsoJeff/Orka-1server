const mongoose = require('mongoose');

const trekkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: [String],
    required: true,
    trim: true,
    enum: ['Adventure', 'Nature', 'Fitness', 'Exploration','others'], // Add more categories as needed
    message: 'Category must be one of the predefined values.'
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  trekDistance: {
    type: Number,
    required: true,
    min: 1, // Minimum distance should be 1 km
    message: 'Trek distance must be a positive number.'
  },
  trekDuration: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => /^[0-9]+ (hour|hours|day|days)$/.test(value), // Validates formats like "3 hours", "1 day"
      message: 'Duration must be in a valid format like "3 hours" or "1 day".'
    }
  },
  costPerPerson: {
    type: Number,
    required: true,
    min: 0, // Cost must be non-negative
    message: 'Cost per person must be a non-negative number.'
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value >= new Date(), // Start date must not be in the past
      message: 'Start date must be a future date.'
    }
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Moderate', 'Difficult', 'Expert'], // Predefined difficulty levels
    message: 'Difficulty must be one of the predefined values.'
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1, // There must be at least one participant allowed
    message: 'Maximum participants must be at least 1.'
  },
  registeredParticipants: {
    type: Number,
    default: 0, // Defaults to 0 if no participants are registered
    min: 0, // Cannot be negative
    validate: {
      validator: function (value) {
        return value <= this.maxParticipants; // Cannot exceed max participants
      },
      message: 'Registered participants cannot exceed the maximum allowed participants.'
    }
  },
  place: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one state must be selected.'
    }
  },
  district: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500, // Restrict description length
    message: 'Description must not exceed 500 characters.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Trekking', trekkingSchema);