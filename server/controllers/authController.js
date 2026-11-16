const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Audit fix S8: the JWT secret has exactly one source of truth - config/env.js
// (which fails fast in production and uses a random per-boot secret in dev).
// Reading process.env directly here bypassed that and signed tokens with
// undefined when no .env existed.
const config = require('../config/env');

// Audit fix S10: pre-computed hash so an unknown-email login costs the same
// bcrypt work as a known-email one, removing the user-enumeration timing
// oracle.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('skillforge-timing-equalizer', 10);

function generateToken(user) {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '7d' });
}

// Audit fix B9: normalize the email exactly like the schema does, so
// lookups match regardless of the casing the client sent.
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    let user;
    try {
      user = await User.create({ username, email: normalizedEmail, password });
    } catch (err) {
      // Audit fix B10: two registrations can pass the pre-check concurrently;
      // the loser hits the unique index. Return a friendly conflict instead
      // of leaking the raw E11000 duplicate-key error.
      if (err && err.code === 11000) {
        return res.status(409).json({ message: 'User already exists' });
      }
      throw err;
    }
    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }
    const token = generateToken(user);
    const { password: pw, ...userData } = user.toObject();
    res.status(201).json({ user: userData, token });
  } catch (err) {
    console.error('Register error:', err.message);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      // S10: burn the same bcrypt time as a real compare before answering
      await bcrypt.compare(String(password || ''), DUMMY_PASSWORD_HASH);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    const { password: pw, ...userData } = user.toObject();
    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};
