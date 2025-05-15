const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const friendController = require('../controllers/friendController');

// All routes require authentication
router.use(authenticate);

// Friend requests
router.post('/requests', friendController.sendFriendRequest);
router.get('/requests/pending', friendController.getPendingRequests);
router.get('/requests/sent', friendController.getSentRequests);
router.put('/requests/:requestId/accept', friendController.acceptFriendRequest);
router.put('/requests/:requestId/reject', friendController.rejectFriendRequest);

// Friends management
router.get('/', friendController.getFriends);
router.delete('/:friendId', friendController.removeFriend);

module.exports = router; 