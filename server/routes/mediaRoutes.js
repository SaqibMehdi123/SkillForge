const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const auth = require('../middleware/auth');
const { imageUpload, handleUploadError } = require('../config/upload');

// S1 + C7: shared hardening - mimetype allowlist (no SVG), server-generated
// uuid filename, 10 MB cap.
const upload = imageUpload({ dir: 'uploads', maxSizeMb: 10 });

router.get('/me', auth, mediaController.getMyMedia);
router.post('/upload', auth, upload.single('file'), handleUploadError, mediaController.uploadMedia);
router.delete('/:id', auth, mediaController.deleteMedia);

module.exports = router; 