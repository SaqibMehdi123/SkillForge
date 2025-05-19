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
      streak = await Streak.create({ 
        user: req.user, 
        currentStreak: 1, 
        longestStreak: 1, 
        lastCheckIn: now,
        todayCheckCount: 1
      });
    } else {
      const last = streak.lastCheckIn || new Date(0);
      const lastDate = new Date(last);
      const today = new Date(now);
      
      // Compare date portions only (ignore time)
      const isSameDay = 
        lastDate.getFullYear() === today.getFullYear() && 
        lastDate.getMonth() === today.getMonth() && 
        lastDate.getDate() === today.getDate();
      
      const hoursDiff = (now - last) / (1000 * 60 * 60);
      
      if (isSameDay) {
        // Already checked in today - just increment counter
        streak.todayCheckCount = (streak.todayCheckCount || 0) + 1;
        // Don't update the streak counter or lastCheckIn time
      } else if (hoursDiff <= 30) { // Within 30 hours
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) 
          streak.longestStreak = streak.currentStreak;
        streak.lastCheckIn = now;
        streak.todayCheckCount = 1; // Reset daily counter
      } else {
        // Streak broken - reset
        streak.currentStreak = 1;
        streak.lastCheckIn = now;
        streak.todayCheckCount = 1; // Reset daily counter
      }
      
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