const mongoose = require('mongoose');

const PracticeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCategory',
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Practice', PracticeSchema);
