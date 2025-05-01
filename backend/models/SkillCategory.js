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
    type: Number,
    default: 15
  },
  thresholds: {
    rookie: { type: Number, default: 300 },
    apprentice: { type: Number, default: 1800 },
    master: { type: Number, default: 6000 },
    grandMaster: { type: Number, default: 18000 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SkillCategory', SkillCategorySchema);
