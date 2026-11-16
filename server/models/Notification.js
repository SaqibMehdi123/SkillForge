const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['friend_request', 'achievement', 'streak_reminder', 'general'], required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Object },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Audit fix P1: notification lists filter user with a createdAt sort
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 