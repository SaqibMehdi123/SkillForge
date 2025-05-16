const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['badge', 'level', 'milestone', 'streak', 'session', 'photo', 'time'], required: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  badgeId: { type: String, required: true }, // Unique identifier for the achievement
  dateUnlocked: { type: Date, default: Date.now },
}, { timestamps: true });

// Create a compound index for user and badgeId to ensure uniqueness
achievementSchema.index({ user: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema); 