const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
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

router.post('/start', auth, practiceController.startSession);
router.post('/complete/:id', auth, upload.single('photo'), practiceController.completeSession);
router.get('/history', auth, practiceController.getHistory);
router.get('/photos', auth, practiceController.getPracticePhotos);
router.post('/sessions', auth, practiceController.saveSession);

module.exports = router; 