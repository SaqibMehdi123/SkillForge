/**
 * Rate limiting (audit fix S4). Nothing in the app was throttled: login and
 * register were open to unlimited brute force, and uploads allowed unbounded
 * disk consumption per account.
 *
 * Limiters are skipped in the test environment (and via DISABLE_RATE_LIMIT)
 * so the supertest suite can hammer endpoints; the factory's behaviour
 * itself is covered by an isolated mini-app test.
 */
const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message, skipOverride }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: message || 'Too many requests, please try again later' },
    skip: skipOverride || (() =>
      process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true'
    ),
  });
}

// Strict bucket for credential endpoints: brute-force costly.
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again in 15 minutes',
});

// Generous global bucket for the API as a whole.
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
});

// Moderate bucket for upload endpoints (disk consumption per account).
const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many uploads, please try again later',
});

module.exports = { createLimiter, authLimiter, apiLimiter, uploadLimiter };
