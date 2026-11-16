/**
 * B9: emails were matched case-sensitively end to end - "USER@x.com" failed
 *     login for an account registered as "user@x.com", and two accounts
 *     differing only in email case could both register.
 * B10: the register pre-check-then-create race leaked a raw Mongo E11000
 *      duplicate-key error (500) when two registrations raced.
 */
const mongoose = require('mongoose');
const { request, app, registerUser, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const User = require('../models/User');

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

describe('B9: email case-insensitivity', () => {
  test('login succeeds with different email casing', async () => {
    const email = `case_login_${uniq()}@example.com`;
    await registerUser({ email });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: email.toUpperCase(), password: 'Passw0rd!123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('a second account differing only in email case cannot be created', async () => {
    const email = `case_dupe_${uniq()}@example.com`;
    await registerUser({ email });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `case_dupe_${uniq()}`,
        email: email.toUpperCase(),
        password: 'Passw0rd!123',
      });

    expect([400, 409]).toContain(res.status);
    expect(JSON.stringify(res.body).toLowerCase()).toMatch(/exist/i);
  });

  test('emails are stored lowercased', async () => {
    const email = `Mixed_Case_${uniq()}@Example.COM`;
    const { user } = await registerUser({ email });

    const stored = await User.findById(user._id).lean();
    expect(stored.email).toBe(email.toLowerCase());
  });
});

describe('B10: duplicate registration never leaks a 500', () => {
  test('concurrent registrations with the same payload: one wins, none 500', async () => {
    const suffix = uniq();
    const payload = {
      username: `race_${suffix}`,
      email: `race_${suffix}@example.com`,
      password: 'Passw0rd!123',
    };

    const results = await Promise.all(
      Array.from({ length: 4 }, () => request(app).post('/api/auth/register').send(payload))
    );

    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201).length).toBe(1);
    expect(statuses.every((s) => s < 500)).toBe(true);
    // The losers surface a friendly conflict message, not a Mongo dump
    for (const r of results.filter((x) => x.status !== 201)) {
      expect(JSON.stringify(r.body)).not.toMatch(/E11000|duplicate key/i);
    }
  });

  test('updateProfile to an email owned by someone else is 400, not 500', async () => {
    const bobEmail = `bob_${uniq()}@example.com`;
    await registerUser({ email: bobEmail });

    const res = await request(app)
      .put('/api/users/me')
      .set(alice.headers)
      .send({ email: bobEmail });

    expect(res.status).toBe(400);
  });
});
