const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['badge', 'level', 'milestone'], required: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  dateUnlocked: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema); 