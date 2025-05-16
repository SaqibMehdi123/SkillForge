const Achievement = require('../models/Achievement');
const User = require('../models/User');
const PracticeSession = require('../models/PracticeSession');

exports.getMyAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ user: req.user });
    res.json(achievements);
  } catch (err) {
    next(err);
  }
};

exports.addAchievement = async (req, res, next) => {
  try {
    const { type, name, description, icon, badgeId, xpReward } = req.body;
    
    // Check if achievement already exists for this user
    const existingAchievement = await Achievement.findOne({ 
      user: req.user,
      badgeId: badgeId
    });
    
    // If achievement is already unlocked, just return it
    if (existingAchievement) {
      return res.status(200).json({
        success: true,
        achievement: existingAchievement,
        message: 'Achievement already unlocked'
      });
    }
    
    // Create new achievement
    const achievement = await Achievement.create({
      user: req.user,
      type,
      name,
      description,
      icon,
      badgeId,
      dateUnlocked: new Date()
    });
    
    // Add badge to user
    const user = await User.findById(req.user);
    if (user) {
      // Add the badge ID to user's badges if not already there
      if (!user.badges.includes(badgeId)) {
        user.badges.push(badgeId);
      }
      
      // Award XP if specified
      if (xpReward && xpReward > 0) {
        user.xp += parseInt(xpReward, 10);
        
        // Handle level up (every 100 * level XP)
        while (user.xp >= user.level * 100) {
          user.xp -= user.level * 100;
          user.level += 1;
          // Bonus coins on level up
          user.coins += 10;
        }
      }
      
      await user.save();
    }
    
    res.status(201).json({
      success: true,
      achievement,
      user: {
        badges: user.badges,
        xp: user.xp,
        level: user.level
      },
      message: 'Achievement unlocked!'
    });
  } catch (err) {
    next(err);
  }
};

// Check and award streak-related achievements
exports.checkStreakAchievements = async (req, res, next) => {
  try {
    // Get current streak from request
    const { streak } = req.body;
    if (!streak) {
      return res.status(400).json({ message: 'Current streak is required' });
    }
    
    // Get user with their current badges
    const user = await User.findById(req.user).select('badges xp level streaks');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Define streak achievements to check
    const streakAchievements = [
      {
        badgeId: 'streak_starter',
        name: 'Streak Starter',
        description: 'Maintain a 3-day streak',
        type: 'streak',
        icon: 'FireIcon',
        requiredStreak: 3,
        xpReward: 150
      },
      {
        badgeId: 'streak_warrior',
        name: 'Streak Warrior',
        description: 'Maintain a 7-day streak',
        type: 'streak',
        icon: 'FireIcon',
        requiredStreak: 7,
        xpReward: 350
      },
      {
        badgeId: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 30-day streak',
        type: 'streak',
        icon: 'FireIcon',
        requiredStreak: 30,
        xpReward: 1000
      }
    ];
    
    // Identify earned achievements and filter out ones user already has
    const newAchievements = streakAchievements
      .filter(ach => streak >= ach.requiredStreak)
      .filter(ach => !user.badges.includes(ach.badgeId));
    
    // If no new achievements, return early
    if (newAchievements.length === 0) {
      return res.json({
        success: true,
        message: 'No new streak achievements earned',
        newAchievements: []
      });
    }
    
    // Save new achievements to database
    const savedAchievements = [];
    for (const ach of newAchievements) {
      const achievement = await Achievement.create({
        user: req.user,
        type: ach.type,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        badgeId: ach.badgeId,
        dateUnlocked: new Date()
      });
      
      // Add badge to user
      user.badges.push(ach.badgeId);
      
      // Award XP
      user.xp += ach.xpReward;
      
      savedAchievements.push({
        ...achievement.toObject(),
        xpReward: ach.xpReward
      });
    }
    
    // Handle level up
    while (user.xp >= user.level * 100) {
      user.xp -= user.level * 100;
      user.level += 1;
      user.coins += 10;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'New streak achievements earned!',
      newAchievements: savedAchievements,
      user: {
        badges: user.badges,
        xp: user.xp,
        level: user.level
      }
    });
  } catch (err) {
    next(err);
  }
}; 