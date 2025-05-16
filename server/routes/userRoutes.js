const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/me', auth, userController.getMe);
router.get('/all', auth, userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/add-friend', auth, userController.addFriend);

// New routes for streak, XP, and badges
router.post('/xp', auth, userController.updateXP);
router.post('/streak', auth, userController.updateStreak);
router.post('/badge', auth, userController.addBadge);

module.exports = router; 