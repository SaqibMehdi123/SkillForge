const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Audit fix C7: same hardening as mediaRoutes - the client's originalname
// must never reach the filesystem path. Server-generated uuid filename,
// image-only filter, 10 MB cap.
const ALLOWED_IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const MIMETYPE_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const extFromName = path.extname(file.originalname || '').toLowerCase();
    const safeExt =
      ALLOWED_IMAGE_EXT.test(extFromName)
        ? extFromName
        : MIMETYPE_TO_EXT[file.mimetype] || '.png';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

function handleUploadError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

router.post('/start', auth, practiceController.startSession);
router.post('/complete/:id', auth, upload.single('photo'), handleUploadError, practiceController.completeSession);
router.get('/history', auth, practiceController.getHistory);
router.get('/photos', auth, practiceController.getPracticePhotos);
router.post('/sessions', auth, practiceController.saveSession);

module.exports = router; 