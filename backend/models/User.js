// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: 'default-profile.png'
  },
  skills: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillCategory'
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number, 
      default: 0
    },
    totalPracticeTime: {
      type: Number, // in minutes
      default: 0
    },
    lastPracticeDate: {
      type: Date
    },
    level: {
      type: String,
      enum: ['Beginner', 'Rookie', 'Apprentice', 'Master', 'Grand Master'],
      default: 'Beginner'
    },
    redeemTokens: {
      type: Number,
      default: 0
    }
  }],
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// models/Practice.js
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
    type: Number, // in minutes
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

// models/SkillCategory.js
const mongoose = require('mongoose');

const SkillCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  minimumDuration: {
    type: Number, // minimum practice duration in minutes
    default: 15
  },
  thresholds: {
    rookie: { type: Number, default: 300 },     // 5 hours (300 minutes)
    apprentice: { type: Number, default: 1800 }, // 30 hours (1800 minutes)
    master: { type: Number, default: 6000 },     // 100 hours (6000 minutes)
    grandMaster: { type: Number, default: 18000 } // 300 hours (18000 minutes)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SkillCategory', SkillCategorySchema);

// models/Achievement.js
const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  type: {
    type: String,
    enum: ['streak', 'practice_time', 'milestones', 'special'],
    required: true
  },
  threshold: {
    type: Number, // The value needed to achieve this (e.g., 7 for a 7-day streak)
    required: true
  },
  skillSpecific: {
    type: Boolean,
    default: false
  },
  skillCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCategory'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', AchievementSchema);