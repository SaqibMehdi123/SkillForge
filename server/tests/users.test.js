const mongoose = require('mongoose');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

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

describe('C3: Find Users page endpoint', () => {
  test('GET /api/users returns all users except the caller (used to 404)', async () => {
    // The Find Users page calls GET /api/users. Before the fix the server only
    // exposed GET /api/users/users, so the page could never load.
    const res = await request(app).get('/api/users').set(alice.headers);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const usernames = res.body.data.map((u) => u.username);
    expect(usernames).toContain(bob.user.username);
    expect(usernames).not.toContain(alice.user.username);
    // Password hashes must never be exposed
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test('GET /api/users requires authentication', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('C4 backend contract: XP / streak / badge endpoints', () => {
  test('PUT /api/users/xp adds XP and levels up at the threshold', async () => {
    const res = await request(app)
      .put('/api/users/xp')
      .set(alice.headers)
      .send({ xp: 250 });

    expect(res.status).toBe(200);
    // 250 XP at level 1: consumes 100 -> level 2 with 150 XP remaining
    expect(res.body.user.level).toBe(2);
    expect(res.body.user.xp).toBe(150);
    expect(res.body.user.coins).toBe(10);
  });

  test('PUT /api/users/xp rejects missing xp', async () => {
    const res = await request(app)
      .put('/api/users/xp')
      .set(alice.headers)
      .send({});
    expect(res.status).toBe(400);
  });

  test('PUT /api/users/streak persists the current streak', async () => {
    const res = await request(app)
      .put('/api/users/streak')
      .set(alice.headers)
      .send({ streak: 7 });

    expect(res.status).toBe(200);
    expect(res.body.streaks.current).toBe(7);
    expect(res.body.streaks.best).toBe(7);
  });

  test('POST /api/users/badges adds a badge exactly once', async () => {
    const res1 = await request(app)
      .post('/api/users/badges')
      .set(alice.headers)
      .send({ badgeId: 'week_warrior' });
    expect(res1.status).toBe(200);
    expect(res1.body.badges).toContain('week_warrior');

    const res2 = await request(app)
      .post('/api/users/badges')
      .set(alice.headers)
      .send({ badgeId: 'week_warrior' });
    expect(res2.body.badges.filter((b) => b === 'week_warrior')).toHaveLength(1);
  });
});
