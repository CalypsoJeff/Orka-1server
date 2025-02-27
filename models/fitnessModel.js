const mongoose = require('mongoose');
const FitnessCategory = require('../models/fitenssCategory');

const fitnessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500, // Restrict description length
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FitnessCategory',
      required: true,

    },
  ],
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'], // Difficulty levels
    trim: true,
  },
  duration: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 0,
      message: 'Duration must be a positive number.',
    },
  },
  workouts: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      restTime: {
        type: Number, // Rest time in seconds
        required: true,
      },
      videoUrl: {
        type: String, // Video URL for the animated guide for each workout
        required: true,
        trim: true,
      },
    },
  ],
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
      'Bicycle',
    ], // Predefined list of equipment
    default: [], // No equipment required by default
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
      'Calves',
    ], // Predefined list of muscle groups
    default: [], // No specific muscles targeted by default
  },
  caloriesBurned: {
    type: Number, // Average calories burned per session
    default: null, // Optional field, defaults to null if not provided
    validate: {
      validator: (value) => value === null || value > 0, // Ensure it's positive if provided
      message: 'Calories burned must be a positive number.',
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Fitness', fitnessSchema);
