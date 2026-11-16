/**
 * S4/S9/S7/S10 hardening:
 *   - S9: express.json kept the 100 KB default while POST /api/photos ships
 *     base64 images as JSON - real webcam photos (~100-500 KB) 500'd. The
 *     limit is raised and PayloadTooLarge maps to 413.
 *   - S7: the error handler echoed raw err.message/stack and mapped nothing -
 *     Mongoose CastError/ValidationError/E11000 all surfaced as 500s with
 *     internals leaked. Now: CastError -> 400, ValidationError -> 400,
 *     duplicate key -> 409, payload too large -> 413, and 5xx bodies are
 *     generic.
 *   - S10: unknown-email logins returned instantly (timing oracle); a dummy
 *     bcrypt compare equalizes the cost.
 *   - S4: rate limiting is added (auth: strict, API: generous) - the factory
 *     is tested directly against a tiny limit here.
 */
const express = require('express');
const mongoose = require('mongoose');
const { request, app, registerUser, TINY_PNG_BASE64 } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const { createLimiter } = require('../middleware/rateLimit');

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

describe('S9: JSON body limit fits real base64 photos', () => {
  test('a ~1 MB base64 photo upload is accepted (was 500 PayloadTooLarge)', async () => {
    // ~1 MB of PNG-ish payload (valid header + padding)
    const bigBase64 = TINY_PNG_BASE64.slice(0, -4) + 'A'.repeat(1024 * 1024);
    const res = await request(app)
      .post('/api/photos')
      .set(alice.headers)
      .send({
        imageData: `data:image/png;base64,${bigBase64}`,
        taskName: 'Big photo',
      });

    expect(res.status).toBe(201);
  });

  test('a body beyond the new limit maps to 413, not 500', async () => {
    const hugeBase64 = TINY_PNG_BASE64.slice(0, -4) + 'A'.repeat(30 * 1024 * 1024);
    const res = await request(app)
      .post('/api/photos')
      .set(alice.headers)
      .send({ imageData: `data:image/png;base64,${hugeBase64}` });

    expect(res.status).toBe(413);
  });
});

describe('S7: error taxonomy', () => {
  test('a garbage id maps to 400 instead of a CastError 500', async () => {
    const res = await request(app)
      .delete('/api/media/not-an-objectid')
      .set(alice.headers);
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/Cast to ObjectId|BSON|cast/i);
  });

  test('malformed JSON is a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": broken');
    expect(res.status).toBe(400);
  });
});

describe('S4: rate limiting (factory behaviour)', () => {
  test('requests beyond the configured max receive 429', async () => {
    // build an isolated app so the production limiters' test-env skip
    // does not hide the behaviour being tested
    const limiter = createLimiter({ windowMs: 60_000, max: 2, skipOverride: () => false });
    const probe = express();
    probe.use('/ping', limiter, (req, res) => res.json({ ok: true }));
    probe.use((err, req, res, next) => res.status(500).json({ message: err.message }));

    const r1 = await request(probe).get('/ping');
    const r2 = await request(probe).get('/ping');
    const r3 = await request(probe).get('/ping');

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
  });

  test('the production limiters are skipped in the test environment', async () => {
    // sanity: hammering the real auth route stays allowed under NODE_ENV=test
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `nobody_${i}@example.com`, password: 'wrongpass' });
      expect(res.status).toBe(400);
    }
  });
});

describe('S10: no cheap user enumeration', () => {
  test('unknown-email login still returns 400 Invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('known-email wrong-password login returns 400 Invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.payload.email, password: 'definitely-wrong-1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
