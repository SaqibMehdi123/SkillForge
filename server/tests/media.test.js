const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { request, app, registerUser, TINY_PNG_BASE64 } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice;
const serverRoot = path.join(__dirname, '..');
const uploadsDir = path.join(serverRoot, 'uploads');

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('C7: media upload hardening (path traversal / type / size)', () => {
  const uploadFile = (buffer, filename, mimetype = 'application/javascript') =>
    request(app)
      .post('/api/media/upload')
      .set(alice.headers)
      .field('type', 'photo')
      .attach('file', buffer, { filename, contentType: mimetype });

  test('a traversal filename is stored under a server-generated safe name', async () => {
    // Image mimetype + hostile filename: the stored name must still be safe
    const res = await uploadFile(Buffer.from('fakepng'), '../../pwned.png', 'image/png');

    // Before the C7 fix the raw originalname was concatenated into the storage
    // path, letting "../../pwned.png" escape the uploads directory.
    expect(res.status).toBe(201);
    const storedName = path.basename(res.body.url.replace(/\\/g, '/'));
    expect(storedName).not.toContain('..');
    expect(storedName).not.toContain('/');
    expect(storedName).toMatch(/\.(png|jpe?g|gif|webp)$/i);
  });

  test('no file escapes the uploads directory', async () => {
    await uploadFile(Buffer.from('x'), '../../../server-package.json');
    const escaped = path.join(serverRoot, 'server-package.json');
    expect(fs.existsSync(escaped)).toBe(false);
  });

  test('non-image files are rejected', async () => {
    const res = await uploadFile(Buffer.from('<script>1</script>'), 'evil.html', 'text/html');
    expect(res.status).toBe(400);
  });

  test('files above the size limit are rejected with a client error', async () => {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
    const res = await uploadFile(bigBuffer, 'big.png', 'image/png');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body).toLowerCase()).toMatch(/large|size|limit/);
  });

  test('a legitimate image upload succeeds and is registered in the DB', async () => {
    const img = Buffer.from(TINY_PNG_BASE64, 'base64');
    const res = await uploadFile(img, 'practice-shot.png', 'image/png');

    expect(res.status).toBe(201);
    expect(res.body.user).toBe(alice.user._id);

    const storedPath = path.join(uploadsDir, path.basename(res.body.url.replace(/\\/g, '/')));
    expect(fs.existsSync(storedPath)).toBe(true);
    expect(fs.statSync(storedPath).size).toBe(img.length);
  });
});
