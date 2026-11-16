/**
 * S3: achievements were fully client-trusted:
 *   - POST /api/achievements granted ARBITRARY client-supplied xpReward
 *     (audit verified: level 45 from a single request).
 *   - POST /api/achievements/check-streak trusted the body's streak
 *     ({"streak": 999} awarded 3 badges and +1500 XP).
 *   - PUT /api/users/streak stored any number verbatim.
 *
 * Now: XP rewards come only from the server catalog keyed by badgeId,
 * streak achievements read the SERVER-computed Streak collection, and
 * user-reported streak numbers are clamped.
 */
const mongoose = require('mongoose');
const { request, app, registerUser, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const User = require('../models/User');
const Streak = require('../models/Streak');

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

/** Fresh user for tests that need uncontaminated badge/streak state */
async function freshUser() {
  return registerUser();
}

describe('S3: XP rewards come from the server catalog only', () => {
  test('a client-supplied xpReward is ignored; catalog reward applies', async () => {
    const res = await request(app)
      .post('/api/achievements')
      .set(alice.headers)
      .send({
        type: 'streak',
        name: 'Streak Starter',
        description: 'Maintain a 3-day streak',
        icon: 'FireIcon',
        badgeId: 'streak_starter',
        xpReward: 100000, // attacker-supplied
      });

    expect(res.status).toBe(201);
    const user = await User.findById(alice.user._id);
    // Catalog says streak_starter = 150 XP. From level 1: 150 - 100 = 50
    // leftover at level 2, +10 level-up coins.
    expect(user.xp).toBe(50);
    expect(user.level).toBe(2);
    expect(user.coins).toBe(10);
    expect(user.badges).toContain('streak_starter');
  });

  test('an unknown badgeId records the achievement but mints NO XP', async () => {
    const before = (await User.findById(alice.user._id)).xp;

    const res = await request(app)
      .post('/api/achievements')
      .set(alice.headers)
      .send({
        type: 'badge',
        name: 'Fake Mega Badge',
        badgeId: `fake_badge_${uniq()}`,
        xpReward: 500000,
      });

    expect(res.status).toBe(201);
    const after = (await User.findById(alice.user._id)).xp;
    expect(after).toBe(before); // zero XP for non-catalog badges
  });

  test('re-posting the same achievement does not double the XP', async () => {
    const before = (await User.findById(alice.user._id)).xp;

    await request(app)
      .post('/api/achievements')
      .set(alice.headers)
      .send({ type: 'streak', name: 'Streak Starter', badgeId: 'streak_starter', xpReward: 100000 });

    const after = (await User.findById(alice.user._id)).xp;
    expect(after).toBe(before);
  });
});

describe('S3: streak achievements read the SERVER streak', () => {
  test('a spoofed body streak awards nothing when the server streak is 0', async () => {
    await Streak.deleteMany({ user: alice.user._id });

    const res = await request(app)
      .post('/api/achievements/check-streak')
      .set(alice.headers)
      .send({ streak: 999 });

    expect(res.status).toBe(200);
    expect(res.body.newAchievements).toEqual([]);

    const user = await User.findById(alice.user._id);
    expect(user.badges).not.toContain('streak_warrior');
    expect(user.badges).not.toContain('streak_master');
  });

  test('a genuine server streak of 5 earns streak_starter but not the 7-day badge', async () => {
    const carol = await freshUser();
    await Streak.create({ user: carol.user._id, currentStreak: 5, longestStreak: 5 });

    const res = await request(app)
      .post('/api/achievements/check-streak')
      .set(carol.headers)
      .send({}); // body is ignored entirely

    expect(res.status).toBe(200);
    const ids = res.body.newAchievements.map((a) => a.badgeId);
    expect(ids).toContain('streak_starter');
    expect(ids).not.toContain('streak_warrior');
    expect(ids).not.toContain('streak_master');

    // Exactly +150 catalog XP: from level 1, 150 XP -> level 2, 50 leftover.
    const user = await User.findById(carol.user._id);
    expect(user.xp).toBe(50);
    expect(user.level).toBe(2);
    expect(user.coins).toBe(10);
  });

  test('the body streak value cannot accelerate earning', async () => {
    const dave = await freshUser();
    await Streak.create({ user: dave.user._id, currentStreak: 1, longestStreak: 1 });

    const res = await request(app)
      .post('/api/achievements/check-streak')
      .set(dave.headers)
      .send({ streak: 30 });

    const ids = res.body.newAchievements.map((a) => a.badgeId);
    expect(ids).toEqual([]); // server streak is 1 -> nothing earned
  });
});

describe('S3: user-reported streak numbers are clamped', () => {
  test('PUT /api/users/streak clamps absurd values', async () => {
    const res = await request(app)
      .put('/api/users/streak')
      .set(alice.headers)
      .send({ streak: 999999, bestStreak: 9999999 });

    expect(res.status).toBe(200);
    expect(res.body.streaks.current).toBeLessThanOrEqual(9999);
    expect(res.body.streaks.best).toBeLessThanOrEqual(9999);
  });

  test('non-numeric streak is rejected', async () => {
    const res = await request(app)
      .put('/api/users/streak')
      .set(alice.headers)
      .send({ streak: 'banana' });
    expect(res.status).toBe(400);
  });
});
