const Streak = require('../models/Streak');

exports.getMyStreak = async (req, res, next) => {
  try {
    let streak = await Streak.findOne({ user: req.user });
    if (!streak) {
      streak = await Streak.create({ user: req.user });
    }
    res.json(streak);
  } catch (err) {
    next(err);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    let streak = await Streak.findOne({ user: req.user });
    const now = new Date();
    if (!streak) {
      streak = await Streak.create({ user: req.user, currentStreak: 1, longestStreak: 1, lastCheckIn: now });
    } else {
      const last = streak.lastCheckIn || new Date(0);
      const diff = (now - last) / (1000 * 60 * 60 * 24);
      if (diff < 1) {
        return res.status(400).json({ message: 'Already checked in today' });
      } else if (diff <= 1.25) {
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastCheckIn = now;
      await streak.save();
    }
    res.json(streak);
  } catch (err) {
    next(err);
  }
};

exports.redeemToken = async (req, res, next) => {
  try {
    let streak = await Streak.findOne({ user: req.user });
    if (!streak || streak.redemptionTokens < 1) {
      return res.status(400).json({ message: 'No redemption tokens available' });
    }
    streak.redemptionTokens -= 1;
    streak.currentStreak += 1;
    if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
    streak.lastCheckIn = new Date();
    await streak.save();
    res.json(streak);
  } catch (err) {
    next(err);
  }
}; 