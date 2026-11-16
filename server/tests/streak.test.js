/**
 * B6: the 30-hour heuristic continued streaks across a fully-skipped
 *     calendar day (last check-in Sun 23:30, next Tue 01:00 = 26h elapsed
 *     but Monday was missed -> streak wrongly went 5 -> 6).
 * B7: todayCheckCount was written by the controller but never declared in
 *     the Streak schema, so Mongoose strict mode silently dropped it and
 *     the daily counter never persisted.
 *
 * The day-boundary logic lives in services/streakService.js as a pure
 * function so these cases can be tested deterministically.
 */
const mongoose = require('mongoose');
const Streak = require('../models/Streak');
const { evaluateCheckIn } = require('../services/streakService');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

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

describe('evaluateCheckIn calendar-day rules (B6, pure unit)', () => {
  test('first-ever check-in starts the streak at 1', () => {
    const now = new Date('2026-03-10T09:00:00');
    const r = evaluateCheckIn({ lastCheckIn: null, currentStreak: 0 }, now);
    expect(r.type).toBe('first');
    expect(r.currentStreak).toBe(1);
    expect(r.todayCheckCount).toBe(1);
  });

  test('same calendar day increments only the daily counter', () => {
    const now = new Date('2026-03-10T18:00:00');
    const r = evaluateCheckIn(
      { lastCheckIn: new Date('2026-03-10T09:00:00'), currentStreak: 4, longestStreak: 6, todayCheckCount: 1 },
      now
    );
    expect(r.type).toBe('same-day');
    expect(r.currentStreak).toBe(4); // unchanged
    expect(r.todayCheckCount).toBe(2);
  });

  test('check-in on the next calendar day continues the streak', () => {
    const now = new Date('2026-03-11T08:00:00');
    const r = evaluateCheckIn(
      { lastCheckIn: new Date('2026-03-10T08:00:00'), currentStreak: 4, longestStreak: 4 },
      now
    );
    expect(r.type).toBe('continue');
    expect(r.currentStreak).toBe(5);
    expect(r.todayCheckCount).toBe(1);
  });

  test('a fully-skipped calendar day resets the streak even under 30h elapsed (B6)', () => {
    // Last check-in Sunday 23:30, now Tuesday 01:00 = 26h elapsed.
    // Monday was entirely missed -> reset. The old hoursDiff<=30 rule
    // wrongly continued the streak here.
    const now = new Date('2026-03-10T01:00:00'); // Tuesday
    const r = evaluateCheckIn(
      { lastCheckIn: new Date('2026-03-08T23:30:00'), currentStreak: 5, longestStreak: 5 }, // Sunday
      now
    );
    expect(r.type).toBe('reset');
    expect(r.currentStreak).toBe(1);
  });

  test('two or more skipped calendar days reset the streak', () => {
    const now = new Date('2026-03-11T09:00:00');
    const r = evaluateCheckIn(
      { lastCheckIn: new Date('2026-03-08T09:00:00'), currentStreak: 9, longestStreak: 9 },
      now
    );
    expect(r.type).toBe('reset');
    expect(r.currentStreak).toBe(1);
  });

  test('longestStreak only grows when the current streak passes it', () => {
    const now = new Date('2026-03-11T08:00:00');
    const r = evaluateCheckIn(
      { lastCheckIn: new Date('2026-03-10T08:00:00'), currentStreak: 4, longestStreak: 10 },
      now
    );
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(10); // unchanged
  });
});

describe('B7: todayCheckCount persists (integration)', () => {
  test('two check-ins on the same day persist todayCheckCount = 2', async () => {
    await Streak.deleteMany({ user: alice.user._id });

    const first = await request(app).post('/api/streaks/checkin').set(alice.headers);
    expect(first.status).toBe(200);
    expect(first.body.currentStreak).toBe(1);

    const second = await request(app).post('/api/streaks/checkin').set(alice.headers);
    expect(second.status).toBe(200);
    expect(second.body.todayCheckCount).toBe(2);

    // The persisted document (not just the response) carries the counter
    const stored = await Streak.findOne({ user: alice.user._id }).lean();
    expect(stored.todayCheckCount).toBe(2);

    const me = await request(app).get('/api/streaks/me').set(alice.headers);
    expect(me.status).toBe(200);
    expect(me.body.todayCheckCount).toBe(2);
  });
});
