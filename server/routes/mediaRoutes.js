const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

router.get('/me', auth, mediaController.getMyMedia);
router.post('/upload', auth, upload.single('file'), mediaController.uploadMedia);
router.delete('/:id', auth, mediaController.deleteMedia);

module.exports = router; 