const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  createPractice,
  getUserPractices,
  getPracticeById,
  getFriendsFeed,
  createTimelapse
} = require('../controllers/practiceController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/practice'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `practice-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.route('/')
  .post(protect, upload.single('image'), createPractice)
  .get(protect, getUserPractices);

router.get('/feed', protect, getFriendsFeed);
router.get('/:id', protect, getPracticeById);
router.post('/timelapse/:skillCategoryId', protect, createTimelapse);

module.exports = router;
