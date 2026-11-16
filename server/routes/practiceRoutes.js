const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const auth = require('../middleware/auth');
const { imageUpload, handleUploadError } = require('../config/upload');

// S1 + C7: shared hardening - mimetype allowlist (no SVG), server-generated
// uuid filename, 10 MB cap.
const upload = imageUpload({ dir: 'uploads', maxSizeMb: 10 });

router.post('/start', auth, practiceController.startSession);
router.post('/complete/:id', auth, upload.single('photo'), handleUploadError, practiceController.completeSession);
router.get('/history', auth, practiceController.getHistory);
router.get('/photos', auth, practiceController.getPracticePhotos);
router.post('/sessions', auth, practiceController.saveSession);

module.exports = router; 