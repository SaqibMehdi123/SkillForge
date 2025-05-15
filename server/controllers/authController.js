const User = require('../models/User');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registering:', username, email);
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ username, email, password });
    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }
    const token = generateToken(user);
    const { password: pw, ...userData } = user.toObject();
    res.status(201).json({ user: userData, token });
  } catch (err) {
    console.error('Register error:', err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    const { password: pw, ...userData } = user.toObject();
    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
}; 