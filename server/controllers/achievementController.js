const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Streak = require('../models/Streak');
const { applyXp } = require('../services/xpService');
const {
  STREAK_ACHIEVEMENTS,
  xpRewardFor,
} = require('../services/achievementService');

exports.getMyAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ user: req.user }).lean();
    res.json(achievements);
  } catch (err) {
    next(err);
  }
};

exports.addAchievement = async (req, res, next) => {
  try {
    const { type, name, description, icon, badgeId } = req.body;

    if (!badgeId || typeof badgeId !== 'string') {
      return res.status(400).json({ message: 'badgeId is required' });
    }

    // Check if achievement already exists for this user (idempotent unlock)
    const existingAchievement = await Achievement.findOne({
      user: req.user,
      badgeId,
    });

    if (existingAchievement) {
      return res.status(200).json({
        success: true,
        achievement: existingAchievement,
        message: 'Achievement already unlocked'
      });
    }

    // Create new achievement - metadata may come from the client, but the
    // XP reward ALWAYS comes from the server catalog (audit fix S3). The
    // client's xpReward field is ignored entirely.
    const achievement = await Achievement.create({
      user: req.user,
      type,
      name,
      description,
      icon,
      badgeId,
      dateUnlocked: new Date()
    });

    const user = await User.findById(req.user);
    if (user) {
      if (!user.badges.includes(badgeId)) {
        user.badges.push(badgeId);
      }

      const xpReward = xpRewardFor(badgeId);
      if (xpReward > 0) {
        // Shared O(1) level rule (audit fixes C9/B5) - the duplicated
        // inline while-loop is gone.
        applyXp(user, xpReward);
      }

      await user.save();

      return res.status(201).json({
        success: true,
        achievement,
        user: {
          badges: user.badges,
          xp: user.xp,
          level: user.level
        },
        message: 'Achievement unlocked!'
      });
    }

    res.status(201).json({
      success: true,
      achievement,
      message: 'Achievement unlocked!'
    });
  } catch (err) {
    next(err);
  }
};

// Check and award streak-related achievements
exports.checkStreakAchievements = async (req, res, next) => {
  try {
    // Audit fix S3: the request body is IGNORED. The streak is read from
    // the server-computed Streak collection, so a spoofed {"streak": 999}
    // can no longer unlock badges or mint XP.
    const streakDoc = await Streak.findOne({ user: req.user }).lean();
    const currentStreak = streakDoc ? streakDoc.currentStreak || 0 : 0;

    const user = await User.findById(req.user).select('badges xp level coins');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Identify earned achievements and filter out ones user already has
    const newAchievements = STREAK_ACHIEVEMENTS
      .filter(ach => currentStreak >= ach.requiredStreak)
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
    let totalXp = 0;
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

      user.badges.push(ach.badgeId);
      const xpReward = xpRewardFor(ach.badgeId);
      totalXp += xpReward;

      savedAchievements.push({
        ...achievement.toObject(),
        xpReward
      });
    }

    // Shared O(1) level rule (audit fixes C9/B5) instead of a duplicated loop
    applyXp(user, totalXp);
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
