const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user;
    let image = null;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if they are friends
    const sender = await User.findById(senderId);
    if (!sender.friends.includes(recipientId)) {
      return res.status(403).json({ message: 'You can only send messages to your friends' });
    }

    // Handle image upload if present
    if (req.file) {
      image = `/uploads/messages/${req.file.filename}`;
    }

    // Create and save the message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      content,
      image
    });

    // Populate sender details before returning
    await message.populate('sender', 'username avatar');

    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
};

// Get conversation with a specific user
exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user;

    // Verify that the users are friends
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(userId)) {
      return res.status(403).json({ message: 'You can only view conversations with your friends' });
    }

    // Get all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, recipient: currentUserId, read: false },
      { read: true }
    );

    res.status(200).json({ data: messages });
  } catch (err) {
    next(err);
  }
};

// Get all conversations (chat list)
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user;

    // Get all messages where the user is either sender or recipient
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { recipient: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              then: "$recipient",
              else: "$sender"
            }
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$recipient", mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          'user.username': 1,
          'user.avatar': 1,
          'user.level': 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.status(200).json({ data: messages });
  } catch (err) {
    next(err);
  }
};

// Upload message image
exports.uploadMessageImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const imageUrl = `/uploads/messages/${req.file.filename}`;
    res.status(200).json({ imageUrl });
  } catch (err) {
    next(err);
  }
}; 