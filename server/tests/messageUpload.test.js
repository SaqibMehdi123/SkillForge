/**
 * B12: message uploads used the RELATIVE destination 'uploads/messages',
 *      which multer resolves against process.cwd(). Started from the repo
 *      root, files landed OUTSIDE the served server/uploads tree and became
 *      unreachable. This test boots a request with cwd set to the repo root
 *      and proves the file still lands in server/uploads/messages.
 *
 * B13: getConversation fetched messages first and marked them read after,
 *      so the response contained stale read:false flags for the very
 *      messages it had just marked read.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { request, app, registerUser, makeFriends, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice, bob;
const serverRoot = path.join(__dirname, '..');
const originalCwd = process.cwd();

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
  bob = await registerUser();
  await makeFriends(alice.user._id, bob.user._id);
});

afterAll(async () => {
  process.chdir(originalCwd);
  await mongoose.disconnect();
  await stopMongo();
});

describe('B13: conversation response reflects fresh read receipts', () => {
  test('messages returned by getConversation are already marked read', async () => {
    // bob sends two unread messages to alice
    for (const text of ['first ping', 'second ping']) {
      const sent = await request(app)
        .post('/api/messages')
        .set(bob.headers)
        .field('recipientId', String(alice.user._id))
        .field('content', text);
      expect(sent.status).toBe(201);
    }

    const res = await request(app)
      .get(`/api/messages/conversations/${bob.user._id}`)
      .set(alice.headers);

    expect(res.status).toBe(200);
    const incoming = res.body.data.filter((m) => m.content.includes('ping'));
    expect(incoming.length).toBe(2);
    // Old code fetched BEFORE updating -> read:false in the response
    for (const m of incoming) {
      expect(m.read).toBe(true);
    }
  });
});

describe('B12: message image upload is cwd-independent', () => {
  test('uploading from the repo root still stores under server/uploads/messages', async () => {
    const messagesDir = path.join(serverRoot, 'uploads', 'messages');
    fs.mkdirSync(messagesDir, { recursive: true });

    try {
      // Simulate `npm start` from the repo root (cwd != server/)
      process.chdir(path.join(serverRoot, '..'));

      const res = await request(app)
        .post('/api/messages/upload-image')
        .set(alice.headers)
        .attach('image', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), {
          filename: 'chat.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(200);
      const storedName = path.basename(res.body.imageUrl);
      // The file MUST exist inside the served uploads tree
      expect(fs.existsSync(path.join(messagesDir, storedName))).toBe(true);
      // ...and MUST NOT have been created relative to the repo root
      expect(fs.existsSync(path.join(serverRoot, '..', 'uploads', 'messages', storedName))).toBe(false);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
