const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { request, app, registerUser, makeFriends, TINY_PNG_BASE64 } = require('./helpers/api');
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

describe('C2: messaging endpoints must not crash on ObjectId construction', () => {
  test('POST /api/messages sends a text message between friends', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .send({ recipientId: bob.user._id, content: 'hello bob' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('hello bob');
  });

  test('POST /api/messages accepts an image-only message (multipart)', async () => {
    const imagePath = path.join(__dirname, 'fixtures', 'tiny.png');
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    fs.writeFileSync(imagePath, Buffer.from(TINY_PNG_BASE64, 'base64'));

    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', bob.user._id)
      .attach('image', imagePath);

    expect(res.status).toBe(201);
    expect(res.body.data.image).toBeTruthy();
    expect(res.body.data.content).toBe('');
  });

  test('GET /api/messages/conversations returns the conversation list (used to 500)', async () => {
    const res = await request(app)
      .get('/api/messages/conversations')
      .set(alice.headers);

    // Before the C2 fix this crashed with:
    //   "Class constructor ObjectId cannot be invoked without 'new'"
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const convo = res.body.data.find((c) => c._id === bob.user._id);
    expect(convo).toBeTruthy();
    // The most recent message (image-only in this suite) becomes lastMessage
    expect(convo.lastMessage).toBeTruthy();
    expect(['hello bob', '']).toContain(convo.lastMessage.content);
    expect(convo.user.username).toBe(bob.user.username);
  });

  test('GET /api/messages/conversations/:userId returns message history and marks read', async () => {
    const res = await request(app)
      .get(`/api/messages/conversations/${bob.user._id}`)
      .set(alice.headers);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].sender.username).toBe(alice.user.username);
  });

  test('GET /api/messages/conversations/:userId rejects non-friends', async () => {
    const stranger = await registerUser();
    const res = await request(app)
      .get(`/api/messages/conversations/${stranger.user._id}`)
      .set(alice.headers);
    expect(res.status).toBe(403);
  });
});
