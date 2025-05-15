const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages');
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