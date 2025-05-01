const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRewards, redeemTokens } = require('../controllers/rewardController');

router.get('/', protect, getRewards);
router.post('/redeem', protect, redeemTokens);

module.exports = router;
