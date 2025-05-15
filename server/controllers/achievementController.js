const Achievement = require('../models/Achievement');

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
    const { type, name, description, icon } = req.body;
    const achievement = await Achievement.create({
      user: req.user,
      type,
      name,
      description,
      icon,
    });
    res.status(201).json(achievement);
  } catch (err) {
    next(err);
  }
}; 