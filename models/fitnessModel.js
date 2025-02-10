const mongoose = require('mongoose');

const fitnessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500 // Restrict description length
  },
  categories: {
    type: [String], // Multiple categories can be assigned to an exercise
    required: true,
    enum: [
      'Cardio',
      'Strength',
      'Flexibility',
      'Endurance',
      'Balance',
      'Yoga',
      'Pilates',
      'HIIT',
      'Functional Training'
    ], // Enum ensures only predefined categories are allowed
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one category must be selected.'
    }
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'], // Difficulty levels
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
  videoUrl: {
    type: String, // URL for the video demonstration
    required: true,
    trim: true
  },
  equipment: {
    type: [String], // List of required equipment
    enum: [
      'None',
      'Dumbbells',
      'Barbell',
      'Resistance Bands',
      'Kettlebell',
      'Medicine Ball',
      'Pull-Up Bar',
      'Treadmill',
      'Yoga Mat',
      'Bicycle'
    ], // Predefined list of equipment
    default: [] // No equipment required by default
  },
  targetMuscles: {
    type: [String], // List of muscles targeted by the exercise
    enum: [
      'Chest',
      'Back',
      'Shoulders',
      'Biceps',
      'Triceps',
      'Abdominals',
      'Quadriceps',
      'Hamstrings',
      'Glutes',
      'Calves'
    ], // Predefined list of muscle groups
    default: [] // No specific muscles targeted by default
  },
  caloriesBurned: {
    type: Number, // Average calories burned per session
    default: null, // Optional field, defaults to null if not provided
    validate: {
      validator: (value) => value === null || value > 0, // Ensure it's positive if provided
      message: 'Calories burned must be a positive number.'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the user/admin who created it
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Fitness', fitnessSchema);