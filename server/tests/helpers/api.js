const request = require('supertest');
const app = require('../../app');

/** Unique suffix so parallel/repeat runs never collide on unique indexes. */
const uniq = () => `${Date.now()}_${Math.round(Math.random() * 1e9)}`;

/**
 * Register a user through the public API and return { user, token, headers }.
 */
async function registerUser({ username, email, password } = {}) {
  const suffix = uniq();
  const payload = {
    username: username || `user_${suffix}`,
    email: email || `user_${suffix}@example.com`,
    password: password || 'Passw0rd!123',
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    payload,
    user: res.body.user,
    token: res.body.token,
    headers: { Authorization: `Bearer ${res.body.token}` },
  };
}

/**
 * Make two users friends by writing both sides of the relation directly.
 * (The friend-request API flow is covered separately in friend flow tests.)
 */
async function makeFriends(userAId, userBId) {
  const User = require('../../models/User');
  await User.updateOne(
    { _id: userAId },
    { $addToSet: { friends: userBId } }
  );
  await User.updateOne(
    { _id: userBId },
    { $addToSet: { friends: userAId } }
  );
}

/** A 1x1 transparent PNG as base64 - the smallest valid image payload. */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

module.exports = { request, app, uniq, registerUser, makeFriends, TINY_PNG_BASE64 };
