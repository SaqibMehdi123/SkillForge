const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  category: { type: String, default: 'general' },
  priority: { type: String, default: 'medium' },
  duration: { type: Number, required: true }, // in minutes
  completed: { type: Boolean, default: false },
  photo: { type: String }, // file path
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  xpEarned: { type: Number, default: 0 },
  coinsEarned: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PracticeSession', practiceSessionSchema); 