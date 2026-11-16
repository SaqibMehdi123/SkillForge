/**
 * B3: `completed: completed || true` in saveSession stored EVERY session as
 *     completed:true (even explicit completed:false) and paid out rewards.
 * B4: completeSession had no already-completed guard, so calling
 *     POST /api/practice/complete/:id twice awarded XP/coins twice.
 */
const mongoose = require('mongoose');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

const User = require('../models/User');
const PracticeSession = require('../models/PracticeSession');

let alice;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('B3: saveSession must respect completed:false', () => {
  test('an explicitly incomplete session is stored as incomplete and unpaid', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({
        skill: 'Sketching',
        duration: 20,
        startedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        endedAt: new Date().toISOString(),
        completed: false, // explicitly NOT completed
      });

    expect(res.status).toBe(201);
    expect(res.body.session.completed).toBe(false);
    expect(res.body.session.xpEarned).toBe(0);
    expect(res.body.session.coinsEarned).toBe(0);

    const user = await User.findById(alice.user._id);
    expect(user.xp).toBe(0); // no reward for an incomplete session
    expect(user.badges).not.toContain('first_steps');

    const stored = await PracticeSession.findById(res.body.session._id);
    expect(stored.completed).toBe(false);
  });

  test('a session with completed omitted still defaults to completed (and paid)', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({
        skill: 'Piano',
        duration: 10,
        startedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        endedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.session.completed).toBe(true);
    expect(res.body.session.xpEarned).toBeGreaterThan(0);
  });
});

describe('B4: completeSession must be idempotent', () => {
  test('completing the same session twice awards XP only once (409 on retry)', async () => {
    const started = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ skill: 'Guitar', duration: 15 });
    expect(started.status).toBe(201);

    const userBefore = await User.findById(alice.user._id);
    const xpBefore = userBefore.xp;
    const coinsBefore = userBefore.coins;

    const first = await request(app)
      .post(`/api/practice/complete/${started.body._id}`)
      .set(alice.headers)
      .send({});
    expect(first.status).toBe(200);
    expect(first.body.completed).toBe(true);

    const xpAfterFirst = (await User.findById(alice.user._id)).xp;
    expect(xpAfterFirst).toBeGreaterThan(xpBefore);

    // Second call: must NOT re-award. Currently re-awards (B4).
    const second = await request(app)
      .post(`/api/practice/complete/${started.body._id}`)
      .set(alice.headers)
      .send({});
    expect(second.status).toBe(409);

    const userAfterSecond = await User.findById(alice.user._id);
    expect(userAfterSecond.xp).toBe(xpAfterFirst); // unchanged
    expect(userAfterSecond.coins).toBe(coinsBefore + first.body.coinsEarned); // only first payout

    // The stored session keeps the original payout
    const stored = await PracticeSession.findById(started.body._id);
    expect(stored.completed).toBe(true);
    expect(stored.xpEarned).toBe(first.body.xpEarned);
  });

  test("another user's session is 404 on complete", async () => {
    const other = await registerUser();
    const started = await request(app)
      .post('/api/practice/start')
      .set(other.headers)
      .send({ skill: 'Secret', duration: 10 });

    const res = await request(app)
      .post(`/api/practice/complete/${started.body._id}`)
      .set(alice.headers)
      .send({});
    expect(res.status).toBe(404);
  });
});
