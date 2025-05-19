const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Access denied. No authentication token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Invalid token format. Expected Bearer token.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token value provided.',
        code: 'EMPTY_TOKEN'
      });
    }
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.id;
      next();
    } catch (err) {
      // Provide specific error messages based on the JWT error
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        console.error('JWT Verification Error:', err);
        return res.status(401).json({ 
          message: 'Token verification failed.',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }
  } catch (err) {
    console.error('Authentication Middleware Error:', err);
    return res.status(500).json({ 
      message: 'Server error during authentication.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
}; 