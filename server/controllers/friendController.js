const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// Send a friend request
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if sender is trying to add themselves
    if (senderId.toString() === recipientId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    // Check if they are already friends
    const sender = await User.findById(senderId);
    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    // Check if a request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'A friend request already exists between you and this user' });
      } else if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends with this user' });
      } else if (existingRequest.status === 'rejected') {
        // If there was a previously rejected request, update it to pending
        existingRequest.status = 'pending';
        existingRequest.sender = senderId;
        existingRequest.recipient = recipientId;
        await existingRequest.save();
        return res.status(200).json({ message: 'Friend request sent successfully' });
      }
    }

    // Create new friend request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });

    res.status(201).json({ message: 'Friend request sent successfully', data: friendRequest });
  } catch (err) {
    next(err);
  }
};

// Get pending friend requests
exports.getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user;

    // Find all pending requests where user is the recipient
    const pendingRequests = await FriendRequest.find({
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'username avatar level');

    res.status(200).json({ data: pendingRequests });
  } catch (err) {
    next(err);
  }
};

// Get sent friend requests
exports.getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user;

    // Find all pending requests where user is the sender
    const sentRequests = await FriendRequest.find({
      sender: userId,
      status: 'pending'
    }).populate('recipient', 'username avatar level');

    res.status(200).json({ data: sentRequests });
  } catch (err) {
    next(err);
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user;

    // Find the request
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Ensure the current user is the recipient
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add each user to the other's friends list
    await User.findByIdAndUpdate(
      friendRequest.sender,
      { $addToSet: { friends: friendRequest.recipient } }
    );

    await User.findByIdAndUpdate(
      friendRequest.recipient,
      { $addToSet: { friends: friendRequest.sender } }
    );

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (err) {
    next(err);
  }
};

// Reject a friend request
exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user;

    // Find the request
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Ensure the current user is the recipient
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (err) {
    next(err);
  }
};

// Get user's friends
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user;
    
    const user = await User.findById(userId).populate('friends', 'username avatar level xp');
    
    res.status(200).json({ data: user.friends });
  } catch (err) {
    next(err);
  }
};

// Remove a friend
exports.removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const userId = req.user;

    // Remove friend from user's friends list
    await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: friendId } }
    );

    // Remove user from friend's friends list
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: userId } }
    );

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (err) {
    next(err);
  }
}; 