const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');
const auth = require('../middleware/auth');

router.get('/me', auth, streakController.getMyStreak);
router.post('/checkin', auth, streakController.checkIn);
router.post('/redeem', auth, streakController.redeemToken);

module.exports = router; 