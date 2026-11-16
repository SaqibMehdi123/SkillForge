const mongoose = require('mongoose');
const User = require('../models/User');
const { applyXp, MAX_XP_PER_REQUEST } = require('../services/xpService');
const path = require('path');
const fs = require('fs');

// Audit fix B9: emails are stored/compared lowercased - keep the helper
// aligned with the schema's lowercase/trim options.
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    // B14 hygiene: a malformed id is a 400, not a CastError 500
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, email, bio, occupation, education, avatar, socialLinks } = req.body;
    
    // Find user
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if updating username and it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }
    
    // Check if updating email and it already exists (audit fix B9: normalize casing)
    if (email && normalizeEmail(email) !== user.email) {
      const normalizedEmail = normalizeEmail(email);
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      user.email = normalizedEmail;
    }
    
    // Update other fields if provided
    if (bio !== undefined) user.bio = bio;
    if (occupation !== undefined) user.occupation = occupation;
    if (education !== undefined) user.education = education;
    if (avatar !== undefined) user.avatar = avatar;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;
    
    // Save user
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user).select('-password');
    
    res.json({ 
      success: true, 
      user: updatedUser,
      message: 'Profile updated successfully' 
    });
  } catch (err) {
    next(err);
  }
};

// Audit fix S2: addFriend was REMOVED. It let any user unilaterally append
// any other user to their own friends array, bypassing the FriendRequest
// consent flow - and since sendMessage authorizes on sender.friends, that
// meant "message any stranger". Friendship now only comes from the
// request/accept flow (friendRoutes).

exports.getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user;
    
    if (!currentUserId) {
      return res.status(401).json({ 
        message: 'User ID not found in request. Authentication may have failed.',
        data: []
      });
    }
    
    console.log('Getting all users for user ID:', currentUserId);
    
    // Get all users except the current user
    // Only return necessary fields for security
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username avatar level xp')
      .sort({ username: 1 });
    
    console.log(`Found ${users.length} users`);
    
    res.status(200).json({ 
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: err.message,
      data: []
    });
  }
};

// Update user XP and level
exports.updateXP = async (req, res, next) => {
  try {
    const { xp } = req.body;
    if (xp === undefined) {
      return res.status(400).json({ message: 'XP amount is required' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add XP with the shared level-up rule (audit fix C9), capped per
    // request so a spoofed 1e15 payload can neither mint absurd levels
    // nor stall the event loop (audit fix B5).
    applyXp(user, Math.min(parseInt(xp, 10) || 0, MAX_XP_PER_REQUEST));

    await user.save();
    
    res.json({ 
      success: true, 
      user: {
        xp: user.xp,
        level: user.level,
        coins: user.coins
      },
      message: 'XP updated successfully' 
    });
  } catch (err) {
    next(err);
  }
};

// Update user streak
exports.updateStreak = async (req, res, next) => {
  try {
    const { streak, bestStreak } = req.body;

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Audit fix S3: values must be numeric and are clamped to sane bounds -
    // the old code parseInt'ed anything (NaN, 9999999) straight into the doc.
    const clamp = (v) => {
      const n = Math.round(Number(v));
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.min(n, 9999);
    };

    // Initialize streaks object if it doesn't exist
    if (!user.streaks) {
      user.streaks = { current: 0, best: 0 };
    }

    // Update current streak if provided
    if (streak !== undefined) {
      const clamped = clamp(streak);
      if (clamped === null) {
        return res.status(400).json({ message: 'streak must be a non-negative number' });
      }
      user.streaks.current = clamped;
    }

    // Update best streak if provided or if current streak is higher
    if (bestStreak !== undefined) {
      const clamped = clamp(bestStreak);
      if (clamped === null) {
        return res.status(400).json({ message: 'bestStreak must be a non-negative number' });
      }
      user.streaks.best = clamped;
    } else if (user.streaks.current > user.streaks.best) {
      user.streaks.best = user.streaks.current;
    }

    // Update last update timestamp
    user.streaks.lastUpdate = new Date();

    await user.save();
    
    res.json({ 
      success: true, 
      streaks: user.streaks,
      message: 'Streak updated successfully' 
    });
  } catch (err) {
    next(err);
  }
};

// Add badge to user
exports.addBadge = async (req, res, next) => {
  try {
    const { badgeId } = req.body;
    if (!badgeId) {
      return res.status(400).json({ message: 'Badge ID is required' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize badges array if it doesn't exist
    if (!user.badges) {
      user.badges = [];
    }

    // Only add the badge if it's not already earned
    if (!user.badges.includes(badgeId)) {
      user.badges.push(badgeId);
      await user.save();
    }
    
    res.json({ 
      success: true, 
      badges: user.badges,
      message: 'Badge added successfully' 
    });
  } catch (err) {
    next(err);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create the avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // If user already has an avatar, delete the old one
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      try {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue even if old avatar deletion fails
      }
    }
    
    // Update user's avatar field
    user.avatar = avatarUrl;
    await user.save();
    
    res.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (err) {
    next(err);
  }
}; 