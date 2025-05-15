const PracticeSession = require('../models/PracticeSession');
const User = require('../models/User');
const path = require('path');

exports.startSession = async (req, res, next) => {
  try {
    const { skill, duration } = req.body;
    const session = await PracticeSession.create({
      user: req.user,
      skill,
      duration,
      startedAt: new Date(),
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session || session.user.toString() !== req.user) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.completed = true;
    session.endedAt = new Date();
    session.xpEarned = req.body.xpEarned || 10;
    session.coinsEarned = req.body.coinsEarned || 1;
    if (req.file) {
      session.photo = path.join('uploads', req.file.filename);
    }
    await session.save();
    // Update user XP/coins
    const user = await User.findById(req.user);
    user.xp += session.xpEarned;
    user.coins += session.coinsEarned;
    await user.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const sessions = await PracticeSession.find({ user: req.user }).sort({ startedAt: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}; 