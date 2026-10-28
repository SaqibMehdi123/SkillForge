const crypto = require('crypto');

/**
 * Central environment/config loading (audit fix C1).
 *
 * The old server.js hard-coded `JWT_SECRET = 'supersecretkey'` as a fallback,
 * which meant anyone who read the public GitHub repo could forge valid tokens
 * for every account. This module inverts that behaviour:
 *
 *  - In production a missing secret is a fatal startup error.
 *  - In development a missing secret gets a RANDOM per-boot value (so tokens
 *    simply expire on restart instead of being forgeable forever).
 *  - There is no hard-coded secret anywhere in the codebase.
 */

function failFastInProduction(name) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `FATAL: ${name} is not set. Refusing to start with an insecure default. ` +
        `Set it in the .env file or in the process environment.`
    );
  }
}

function loadJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (value && value.trim() !== '') return value;

  failFastInProduction('JWT_SECRET');

  const random = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[config] WARNING: JWT_SECRET not set - using a random per-boot secret (development only). ' +
      'All tokens will be invalidated when the server restarts.'
  );
  return random;
}

function loadMongoUri() {
  const value = process.env.MONGO_URI;
  if (value && value.trim() !== '') return value;

  failFastInProduction('MONGO_URI');

  console.warn(
    '[config] WARNING: MONGO_URI not set - falling back to mongodb://127.0.0.1:27017/skillforge (development only).'
  );
  return 'mongodb://127.0.0.1:27017/skillforge';
}

const config = {
  JWT_SECRET: loadJwtSecret(),
  MONGO_URI: loadMongoUri(),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  PORT: process.env.PORT || 5000,
};

module.exports = config;
