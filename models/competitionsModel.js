const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: [String],
    required: true,
    trim: true,
    enum: ['Sports', 'Technology', 'Cultural', 'Art', 'Music', 'Dance', 'Fitness', 'Education'], // Add categories as needed
    message: 'Category must be one of the predefined values.'
  },
  image: {
    type: String,
    // required: true,
    trim: true
  },
  time: {
    type: String,
    required: true,
    // validate: {
    //   validator: (value) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value), // Validates time format HH:MM
    //   message: 'Time must be in HH:MM format.'
    // }
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value >= new Date(), // Ensures date is not in the past
      message: 'Date must be today or a future date.'
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
  town: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 0,
      message: 'Duration must be a positive number.'
    }
  },
  type: {
    type: [String],
    required: true,
    enum: ['Inter Corporates', 'Inter College', 'Intra College', 'State Level', 'National Level'], // Add more types as needed
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one type must be selected.'
    }
  },
  cost: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value >= 0,
      message: 'Cost must be a non-negative number.'
    }
  },
  maxRegistrations: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 0,
      message: 'Max registrations must be a positive number.'
    }
  },
  registeredParticipants: {
    type: [
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        registrationDate: { type: Date, default: Date.now }
      }
    ],
    validate: {
      validator: function (value) {
        return value.length <= this.maxRegistrations; // Ensure participants do not exceed max allowed
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
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',
    message: 'Status must be either "active" or "inactive".'
  }
}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);
