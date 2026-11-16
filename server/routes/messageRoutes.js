const express = require('express');
const router = express.Router();
const { imageUpload, handleUploadError } = require('../config/upload');
const authenticate = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// S1 + C7 + B12: shared hardening (mimetype allowlist, server-generated
// uuid filename, 5 MB cap), destination resolved from config/upload.js so
// it is cwd-independent.
const upload = imageUpload({ dir: 'uploads/messages', maxSizeMb: 5 });

// Message routes with authentication middleware
router.post('/', authenticate, upload.single('image'), handleUploadError, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversations/:userId', authenticate, messageController.getConversation);
router.post('/upload-image', authenticate, upload.single('image'), handleUploadError, messageController.uploadMessageImage);

module.exports = router; 