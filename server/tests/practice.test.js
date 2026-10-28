const mongoose = require('mongoose');
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

describe('C9: XP must be computed server-side, not trusted from the client', () => {
  test('POST /api/practice/sessions ignores client-supplied xpEarned/coinsEarned', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({
        skill: 'Guitar',
        category: 'music',
        priority: 'high',
        duration: 30, // minutes
        startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        completed: true,
        xpEarned: 99999, // attacker-supplied
        coinsEarned: 8888, // attacker-supplied
      });

    expect(res.status).toBe(201);

    const User = require('../models/User');
    const user = await User.findById(alice.user._id);
    // 30 minutes -> server computes round(30/5)=6 XP and round(30/10)=3 coins.
    // The spoofed xpEarned=99999 / coinsEarned=8888 are ignored.
    // Additionally the FIRST completed session unlocks 'first_steps'
    // (+100 XP -> level 2, +10 bonus coins), so:
    expect(user.xp).toBe(6);        // (6 + 100) - 100 consumed by level-up
    expect(user.level).toBe(2);
    expect(user.coins).toBe(13);    // 3 + 10 level-up bonus

    const history = await request(app).get('/api/practice/history').set(alice.headers);
    const saved = history.body.find((s) => s.skill === 'Guitar');
    expect(saved.xpEarned).toBe(6);
    expect(saved.coinsEarned).toBe(3);
  });

  test('duration is stored in minutes and history returns seconds (30 min -> 1800 s)', async () => {
    const history = await request(app).get('/api/practice/history').set(alice.headers);
    const saved = history.body.find((s) => s.skill === 'Guitar');
    expect(saved.duration).toBe(1800); // 30 * 60 - the format the dashboards expect
  });

  test('absurd durations are clamped before XP is awarded', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({
        skill: 'Speedrun',
        duration: 100000, // ~69 days claimed in one request
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        completed: true,
      });

    expect(res.status).toBe(201);

    const User = require('../models/User');
    const user = await User.findById(alice.user._id);
    // 100000 min clamped to 1440 min -> +288 XP (6+288=294, level 3 consumes
    // 200 -> 94 left), +144 coins
    expect(user.xp).toBe(94);
    expect(user.level).toBe(3);
    expect(user.coins).toBe(13 + 144 + 10); // +10 level-up bonus at level 3

    const history = await request(app).get('/api/practice/history').set(alice.headers);
    const saved = history.body.find((s) => s.skill === 'Speedrun');
    // Clamped duration is what gets stored and paid out
    expect(saved.duration).toBe(1440 * 60);
    expect(saved.xpEarned).toBe(288);
  });

  test('POST /api/practice/complete/:id recomputes XP from real elapsed time', async () => {
    const started = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ skill: 'Piano', duration: 25 });
    expect(started.status).toBe(201);

    const User = require('../models/User');
    const before = (await User.findById(alice.user._id)).xp;

    const res = await request(app)
      .post(`/api/practice/complete/${started.body._id}`)
      .set(alice.headers)
      .send({ xpEarned: 99999, coinsEarned: 9999 });

    expect(res.status).toBe(200);
    // Elapsed time is a few seconds -> minimum reward, NOT the client's 99999
    expect(res.body.xpEarned).toBe(1);

    const after = (await User.findById(alice.user._id)).xp;
    expect(after - before).toBe(1);
  });

  test('negative or missing duration is rejected', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({ skill: 'Whatever', duration: -5, startedAt: new Date().toISOString(), endedAt: new Date().toISOString() });
    expect(res.status).toBe(400);
  });
});
