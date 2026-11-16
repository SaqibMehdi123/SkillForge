const Streak = require('../models/Streak');
const { evaluateCheckIn, getOrCreateStreak } = require('../services/streakService');

exports.getMyStreak = async (req, res, next) => {
  try {
    const streak = await getOrCreateStreak(req.user);
    res.json(streak);
  } catch (err) {
    next(err);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    const streak = await getOrCreateStreak(req.user);

    // Audit fix B6: calendar-day rules (yesterday/today continue, anything
    // older resets) instead of the leaky 30-hour heuristic.
    const result = evaluateCheckIn(streak, new Date());

    streak.currentStreak = result.currentStreak;
    streak.longestStreak = result.longestStreak;
    streak.lastCheckIn = result.lastCheckIn;
    // Audit fix B7: todayCheckCount is now a real schema field.
    streak.todayCheckCount = result.todayCheckCount;

    await streak.save();
    res.json(streak);
  } catch (err) {
    next(err);
  }
};

exports.redeemToken = async (req, res, next) => {
  try {
    const streak = await getOrCreateStreak(req.user);
    if (!streak.redemptionTokens || streak.redemptionTokens < 1) {
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
