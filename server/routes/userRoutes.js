const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/me', auth, userController.getMe);
router.get('/all', auth, userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/add-friend', auth, userController.addFriend);

module.exports = router; 