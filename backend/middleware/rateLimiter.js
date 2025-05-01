const rateLimit = require('rate-limiter-flexible');

const rateLimiters = {
  login: new rateLimit.RateLimiterMemory({
    points: 5,
    duration: 60 * 15 // 15 minutes
  }),
  
  practice: new rateLimit.RateLimiterMemory({
    points: 30,
    duration: 60 // 1 minute
  }),
  
  general: new rateLimit.RateLimiterMemory({
    points: 100,
    duration: 60
  })
};

const rateLimiterMiddleware = (limiterType = 'general') => {
  return async (req, res, next) => {
    try {
      await rateLimiters[limiterType].consume(req.ip);
      next();
    } catch (error) {
      res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: error.msBeforeNext / 1000
      });
    }
  };
};

module.exports = rateLimiterMiddleware;
