const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String, default: '' },
  occupation: { type: String, default: '' },
  education: { type: String, default: '' },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  badges: [{ type: String }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  streak: { type: Number, default: 0 },
  streaks: {
    current: { type: Number, default: 0 },
    best: { type: Number, default: 0 },
    lastUpdate: { type: Date }
  },
  redemptionTokens: { type: Number, default: 0 },
  privacy: {
    profile: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    progress: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 