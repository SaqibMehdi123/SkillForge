const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Audit fix C7: the previous config concatenated the raw client-supplied
// `originalname` into the storage path (Date.now() + '-' + file.originalname),
// which allowed "../../pwned.js" to escape the uploads directory and let any
// file type of any size be written to the server. The hardening below:
//   1. only accepts real image mimetypes,
//   2. caps the size at 10 MB,
//   3. ALWAYS generates the filename server-side (uuid + safe extension),
//      so client input can never influence the write path.
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Translate multer errors into 4xx responses instead of leaking a 500 stack
function handleUploadError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

router.get('/me', auth, mediaController.getMyMedia);
router.post('/upload', auth, upload.single('file'), handleUploadError, mediaController.uploadMedia);
router.delete('/:id', auth, mediaController.deleteMedia);

module.exports = router; 