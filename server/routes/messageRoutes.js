const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Audit fix B12: the destination was the RELATIVE 'uploads/messages', which
// multer resolves against process.cwd() - started from the repo root, files
// landed outside the served server/uploads tree and became unreachable.
// Resolve against this file's location instead, independent of cwd.
const MESSAGE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'messages');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(MESSAGE_UPLOAD_DIR, { recursive: true });
    cb(null, MESSAGE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Message routes with authentication middleware
router.post('/', authenticate, upload.single('image'), messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversations/:userId', authenticate, messageController.getConversation);
router.post('/upload-image', authenticate, upload.single('image'), messageController.uploadMessageImage);

module.exports = router; 