/**
 * S2: POST /api/users/friends let any user unilaterally append ANY user to
 *     their own friends array - bypassing the whole FriendRequest consent
 *     flow. Because sendMessage authorizes on sender.friends, this converted
 *     directly into "message any stranger".
 *
 * The endpoint is removed; friendship requires the request/accept flow.
 */
const mongoose = require('mongoose');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const User = require('../models/User');

let alice, bob;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
  bob = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('S2: the one-way friendship bypass is closed', () => {
  test('POST /api/users/friends no longer creates a friendship', async () => {
    const res = await request(app)
      .post('/api/users/friends')
      .set(alice.headers)
      .send({ friendId: String(bob.user._id) });

    // The route no longer exists (or refuses) - either way no friendship
    expect(res.status).toBeGreaterThanOrEqual(400);

    const [a, b] = await Promise.all([
      User.findById(alice.user._id).lean(),
      User.findById(bob.user._id).lean(),
    ]);
    expect(a.friends.map(String)).not.toContain(String(bob.user._id));
    expect(b.friends.map(String)).not.toContain(String(alice.user._id));
  });

  test('messaging still requires mutual consent via the request flow', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', String(bob.user._id))
      .field('content', 'cold outreach');
    expect(res.status).toBe(403); // not friends
  });
});
