/**
 * B5: applyXp used `while (user.xp >= user.level * 100)` with no ceiling.
 * PUT /api/users/xp {"xp": 1e15} blocked the event loop for >10 seconds and
 * minted level 4,472,136 (verified in audit). Number.MAX_SAFE_INTEGER hangs
 * the server indefinitely - a trivial DoS by any logged-in account.
 *
 * Fix: closed-form level math (O(1)) + a per-request XP cap on the
 * client-facing endpoint.
 */
const { applyXp } = require('../services/xpService');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice;

beforeAll(async () => {
  await startMongo();
  await require('mongoose').connect(process.env.MONGO_URI);
  alice = await registerUser();
});

afterAll(async () => {
  await require('mongoose').disconnect();
  await stopMongo();
});

describe('applyXp level rule (unit)', () => {
  test('100 XP from level 1 -> level 2, xp 0, +10 coins', () => {
    const user = { xp: 0, level: 1, coins: 0 };
    applyXp(user, 100);
    expect(user.level).toBe(2);
    expect(user.xp).toBe(0);
    expect(user.coins).toBe(10);
  });

  test('300 XP total -> level 3 (levels 1->2 and 2->3 = 100+200), +20 coins', () => {
    const user = { xp: 0, level: 1, coins: 0 };
    applyXp(user, 300);
    expect(user.level).toBe(3);
    expect(user.xp).toBe(0);
    expect(user.coins).toBe(20);
  });

  test('leftover XP is kept inside the level (301 -> level 3, xp 1)', () => {
    const user = { xp: 0, level: 1, coins: 0 };
    applyXp(user, 301);
    expect(user.level).toBe(3);
    expect(user.xp).toBe(1);
  });

  test('600 XP total -> exactly level 4, +30 coins', () => {
    const user = { xp: 0, level: 1, coins: 0 };
    applyXp(user, 600);
    expect(user.level).toBe(4);
    expect(user.xp).toBe(0);
    expect(user.coins).toBe(30);
  });

  test('huge XP completes instantly (no while-loop) and stays within sane bounds', () => {
    const user = { xp: 0, level: 1, coins: 0 };
    const start = Date.now();
    applyXp(user, 1e15);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50); // O(1) math, not a loop
    expect(user.level).toBeGreaterThan(1);
    expect(Number.isFinite(user.level)).toBe(true);
  });

  test('XP applied mid-level uses the true cumulative total (no level downgrade)', () => {
    // A user at level 2 with 6 leftover XP receives 288 more:
    // total = 6 + T(2)=100 + 288 = 394 -> level 3, leftover 94. Computing the
    // level from the leftover alone would have DOWNGRADED them to level 2.
    const user = { xp: 6, level: 2, coins: 10 };
    applyXp(user, 288);
    expect(user.level).toBe(3);
    expect(user.xp).toBe(94);
    expect(user.coins).toBe(20); // +10 for the level-up
  });
});

describe('B5: PUT /api/users/xp cannot mint absurd levels or stall the server', () => {
  test('xp: 1e15 is capped per-request and returns promptly', async () => {
    const res = await request(app)
      .put('/api/users/xp')
      .set(alice.headers)
      .send({ xp: 1e15 });

    expect(res.status).toBe(200);
    // 500 XP/request cap -> level 3 with 200 XP left over (T(3)=300, T(4)=600)
    expect(res.body.user.level).toBeLessThanOrEqual(4);
    expect(res.body.user.xp).toBeLessThan(600);
  });

  test('negative xp is not applied', async () => {
    const res = await request(app)
      .put('/api/users/xp')
      .set(alice.headers)
      .send({ xp: -1000 });
    expect(res.status).toBe(200);
    expect(res.body.user.xp).toBeGreaterThanOrEqual(0);
  });
});
