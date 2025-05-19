const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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
    
    // Check if updating email and it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      user.email = email;
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

exports.addFriend = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    const friend = await User.findById(req.body.friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }
    user.friends.push(friend._id);
    await user.save();
    res.json({ message: 'Friend added' });
  } catch (err) {
    next(err);
  }
};

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

    // Add XP
    user.xp += parseInt(xp, 10);
    
    // Handle level up (every 100 * level XP)
    while (user.xp >= user.level * 100) {
      user.xp -= user.level * 100;
      user.level += 1;
      user.coins += 10; // Bonus coins on level up
    }

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

    // Initialize streaks object if it doesn't exist
    if (!user.streaks) {
      user.streaks = { current: 0, best: 0 };
    }

    // Update current streak if provided
    if (streak !== undefined) {
      user.streaks.current = parseInt(streak, 10);
    }
    
    // Update best streak if provided or if current streak is higher
    if (bestStreak !== undefined) {
      user.streaks.best = parseInt(bestStreak, 10);
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