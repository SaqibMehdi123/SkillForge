/**
 * B11: malformed request bodies surfaced as 500s instead of 400s.
 *   - POST /api/practice/start with no skill -> ValidationError 500
 *   - POST /api/practice/start with negative duration -> accepted (201)
 *   - POST /api/messages with neither content nor image -> ValidationError 500
 *   - POST /api/messages with a garbage recipientId -> CastError 500
 *   - POST /api/practice/sessions with a non-date startedAt -> CastError 500
 *   - POST /api/photos with a garbage sessionId -> CastError 500
 */
const mongoose = require('mongoose');
const { request, app, registerUser, makeFriends, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice, bob;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
  bob = await registerUser();
  await makeFriends(alice.user._id, bob.user._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('B11: practice/start validation', () => {
  test('missing skill is a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ duration: 25 });
    expect(res.status).toBe(400);
  });

  test('negative duration is a 400, not silently stored', async () => {
    const res = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ skill: 'Guitar', duration: -50 });
    expect(res.status).toBe(400);
  });

  test('a valid start still returns 201 with a sane duration', async () => {
    const res = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ skill: 'Guitar', duration: 25 });
    expect(res.status).toBe(201);
    expect(res.body.duration).toBe(25);
  });

  test('an absurd duration is clamped to the documented maximum', async () => {
    const res = await request(app)
      .post('/api/practice/start')
      .set(alice.headers)
      .send({ skill: 'Marathon', duration: 999999 });
    expect(res.status).toBe(201);
    expect(res.body.duration).toBe(1440);
  });
});

describe('B11: message validation', () => {
  test('a message with no content and no image is a 400, not a 500', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', String(bob.user._id))
      .field('content', '');
    expect(res.status).toBe(400);
  });

  test('a garbage recipientId is a 400, not a CastError 500', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', 'not-an-objectid')
      .field('content', 'hello');
    expect(res.status).toBe(400);
  });

  test('a practicePhotoUrl outside /uploads/photos/ is rejected', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', String(bob.user._id))
      .field('content', 'check this out')
      .field('practicePhotoUrl', 'https://evil.example.com/track.png');
    expect(res.status).toBe(400);
  });
});

describe('B11: session/photo field validation', () => {
  test('a non-date startedAt is a 400, not a CastError 500', async () => {
    const res = await request(app)
      .post('/api/practice/sessions')
      .set(alice.headers)
      .send({
        skill: 'Guitar',
        duration: 10,
        startedAt: 'not-a-date',
        endedAt: new Date().toISOString(),
      });
    expect(res.status).toBe(400);
  });

  test('a garbage sessionId on a photo upload is a 400, not a CastError 500', async () => {
    const { TINY_PNG_BASE64 } = require('./helpers/api');
    const res = await request(app)
      .post('/api/photos')
      .set(alice.headers)
      .send({
        imageData: `data:image/png;base64,${TINY_PNG_BASE64}`,
        taskName: 'Snapshot',
        sessionId: 'garbage-id',
      });
    expect(res.status).toBe(400);
  });
});
