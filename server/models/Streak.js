const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckIn: { type: Date },
  // Audit fix B7: the controller wrote this field but it was missing from
  // the schema, so Mongoose strict mode silently dropped it and the daily
  // check-in counter never persisted.
  todayCheckCount: { type: Number, default: 0 },
  redemptionTokens: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Streak', streakSchema); 