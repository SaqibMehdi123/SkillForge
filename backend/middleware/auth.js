const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Fixed casing to match actual file

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        throw new Error('User not found');
      }
      
      next();
    } else {
      throw new Error('Not authorized, no token');
    }
  } catch (error) {
    res.status(401).json({ 
      message: error.message || 'Not authorized',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

module.exports = { protect };
