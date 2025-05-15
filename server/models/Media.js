const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession' },
  url: { type: String, required: true },
  type: { type: String, enum: ['photo', 'timelapse'], required: true },
  metadata: { type: Object },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema); 