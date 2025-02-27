const mongoose = require('mongoose');

const fitnessCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Ensure category names are unique
  },
}, { timestamps: true });

module.exports = mongoose.model('FitnessCategory', fitnessCategorySchema);
