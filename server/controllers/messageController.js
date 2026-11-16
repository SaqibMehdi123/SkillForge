const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Audit fix S11: a practicePhotoUrl may only reference a photo under the
 * server-controlled /uploads/photos/ directory. Accepts a relative path or
 * an absolute URL on any origin, but always stores the relative path -
 * arbitrary external URLs (tracking pixels, spoofed content) are rejected.
 */
function safePracticePhotoUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim(), 'http://resolve.invalid');
    const match = url.pathname.match(/^\/uploads\/photos\/([A-Za-z0-9._-]+)$/);
    return match ? `/uploads/photos/${match[1]}` : null;
  } catch {
    return null;
  }
}

// Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, practicePhotoUrl } = req.body;
    const senderId = req.user;

    // Audit fix B11: validate ids and payload at the boundary.
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'A valid recipientId is required' });
    }
    const hasImage = Boolean(req.file);
    const hasContent = typeof content === 'string' && content.trim().length > 0;
    const safePhotoUrl = safePracticePhotoUrl(practicePhotoUrl);
    // S11: an explicit practicePhotoUrl that does not resolve to a
    // server-controlled photo is rejected outright, even when the message
    // also carries text.
    if (hasPhotoUrlInput(practicePhotoUrl) && !safePhotoUrl) {
      return res.status(400).json({
        message: 'practicePhotoUrl must reference a photo under /uploads/photos/'
      });
    }
    if (!hasImage && !hasContent && !safePhotoUrl) {
      return res.status(400).json({
        message: 'Message must include text, an image, or a practice photo'
      });
    }

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

    // Create message data
    const messageData = {
      sender: senderId,
      recipient: recipientId,
      content: hasContent ? content.trim() : '',
    };
    
    // Handle image upload if present
    if (req.file) {
      messageData.image = `/uploads/messages/${req.file.filename}`;
    } else if (safePhotoUrl) {
      // Only a validated /uploads/photos/ path is accepted (S11)
      messageData.image = safePhotoUrl;
    }

    // Create and save the message
    const message = await Message.create(messageData);

    // Populate sender details before returning
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');

    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
};

function hasPhotoUrlInput(raw) {
  return typeof raw === 'string' && raw.trim().length > 0;
}

// Get conversation with a specific user
exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user;

    // Check if the userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Verify that the users are friends
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.friends.includes(userId)) {
      return res.status(403).json({ message: 'You can only view conversations with your friends' });
    }

    // Audit fix B13: mark as read BEFORE fetching, otherwise the response
    // carries stale read:false flags for the very messages being marked.
    await Message.updateMany(
      { sender: userId, recipient: currentUserId, read: false },
      { read: true }
    );

    // Get all messages between the two users
    // Use strict filtering to ensure only messages directly between these two users are returned
    const messages = await Message.find({
      $or: [
        // Messages from current user to specified friend
        { sender: currentUserId, recipient: userId },
        // Messages from specified friend to current user
        { sender: userId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .lean();

    res.status(200).json({ data: messages });
  } catch (err) {
    next(err);
  }
};

// Get all conversations (chat list)
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user;

    // First get the user's friends to ensure we only return conversations with friends
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all messages where the user is either sender or recipient
    // And the other party is a friend
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) }
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
              if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              then: "$recipient",
              else: "$sender"
            }
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$recipient", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      // Only include conversations with friends
      {
        $match: {
          _id: { $in: user.friends }
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