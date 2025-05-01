// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  sendFriendRequest,
  acceptFriendRequest
} = require('../controllers/userController');

// Configure multer storage for profile images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `user-${req.user ? req.user._id : 'new'}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, gif)'));
    }
  }
});

// User routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put(
  '/profile',
  protect,
  upload.single('profileImage'),
  updateUserProfile
);
router.post('/:id/friend-request', protect, sendFriendRequest);
router.post('/friend-request/:id/accept', protect, acceptFriendRequest);

module.exports = router;

// routes/practiceRoutes.js
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

// Configure multer storage for practice images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/practice');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `practice-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, gif)'));
    }
  }
});

// Practice routes
router.post('/', protect, upload.single('image'), createPractice);
router.get('/', protect, getUserPractices);
router.get('/feed', protect, getFriendsFeed);
router.get('/:id', protect, getPracticeById);
router.post('/timelapse/:skillCategoryId', protect, createTimelapse);

module.exports = router;

// routes/skillCategoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  createSkillCategory,
  getSkillCategories,
  getUserSkillCategories
} = require('../controllers/skillCategoryController');

// Configure multer storage for category icons
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/category');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `category-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, gif, svg)'));
    }
  }
});

// Skill Category routes
router.post('/', protect, upload.single('icon'), createSkillCategory);
router.get('/', getSkillCategories);
router.get('/user', protect, getUserSkillCategories);

module.exports = router;

// routes/achievementRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  createAchievement,
  getAchievements,
  getUserAchievements
} = require('../controllers/achievementController');

// Configure multer storage for achievement icons
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/achievement');
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `achievement-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, gif, svg)'));
    }
  }
});

// Achievement routes
router.post('/', protect, upload.single('icon'), createAchievement);
router.get('/', getAchievements);
router.get('/user', protect, getUserAchievements);

module.exports = router;