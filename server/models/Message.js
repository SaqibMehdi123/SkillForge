const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  content: { 
    type: String,
    // An image-only message has no text - only require content when there is no image.
    required: function () {
      return !this.image;
    },
    default: '',
  },
  image: { 
    type: String 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

// Audit fix P1: every message query filters sender/recipient with a
// createdAt sort - without these, each chat request scanned the collection.
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema); 