const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
}, { timestamps: true });

// Compound index to ensure uniqueness
friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

// Audit fix P1: the pending/sent request lists filter recipient or sender
// with a status - the unique pair index cannot serve them.
friendRequestSchema.index({ recipient: 1, status: 1 });
friendRequestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema); 