const User = require('../models/User');

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