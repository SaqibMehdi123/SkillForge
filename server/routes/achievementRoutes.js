const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const auth = require('../middleware/auth');

router.get('/me', auth, achievementController.getMyAchievements);
router.post('/', auth, achievementController.addAchievement);

module.exports = router; 