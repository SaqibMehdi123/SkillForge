/**
 * S1: the avatar and message upload routes kept CLIENT-CONTROLLED file
 *     extensions. Uploading evil.html with a spoofed image/png mimetype
 *     stored avatar-*.html, which GET /uploads/avatars/avatar-*.html served
 *     as text/html - stored XSS on the API origin. SVG (image/svg+xml)
 *     passed the "image/*" filter too and executes scripts when opened
 *     directly.
 *
 * The fix routes every uploader through config/upload.js: mimetype
 * allowlist (png/jpeg/gif/webp), server-generated uuid filenames, and the
 * client's originalname never touches the filesystem.
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { request, app, registerUser, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice;
const serverRoot = path.join(__dirname, '..');

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('S1: avatar upload hardening', () => {
  test('an .html payload with a spoofed image mimetype is NOT stored as .html', async () => {
    const res = await request(app)
      .post('/api/users/avatar')
      .set(alice.headers)
      .attach('avatar', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.html',
        contentType: 'image/png', // spoofed
      });

    // Before the fix this was 200 with avatar-*.html stored
    expect(res.status).toBe(200);
    const storedName = path.basename(res.body.avatarUrl);
    expect(storedName.endsWith('.html')).toBe(false);
    expect(storedName.endsWith('.png')).toBe(true);

    // The stored file must not be served as text/html
    const served = await request(app).get(res.body.avatarUrl);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).not.toMatch(/text\/html/i);
  });

  test('SVG is rejected outright (script execution vector)', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const res = await request(app)
      .post('/api/users/avatar')
      .set(alice.headers)
      .attach('avatar', Buffer.from(svg), {
        filename: 'evil.svg',
        contentType: 'image/svg+xml',
      });

    expect(res.status).toBe(400);
  });

  test('a legitimate PNG avatar still uploads', async () => {
    const TINY_PNG_BASE64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/users/avatar')
      .set(alice.headers)
      .attach('avatar', Buffer.from(TINY_PNG_BASE64, 'base64'), {
        filename: 'me.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fs.existsSync(path.join(serverRoot, res.body.avatarUrl.replace(/^\//, '')))).toBe(true);
  });
});

describe('S1: message image upload hardening', () => {
  test('an .html payload with a spoofed image mimetype is NOT stored as .html', async () => {
    const res = await request(app)
      .post('/api/messages/upload-image')
      .set(alice.headers)
      .attach('image', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.html',
        contentType: 'image/png', // spoofed
      });

    expect(res.status).toBe(200);
    const storedName = path.basename(res.body.imageUrl);
    expect(storedName.endsWith('.html')).toBe(false);
    expect(storedName.endsWith('.png')).toBe(true);
  });

  test('non-image mimetypes are rejected with a 4xx', async () => {
    const res = await request(app)
      .post('/api/messages/upload-image')
      .set(alice.headers)
      .attach('image', Buffer.from('console.log(1)'), {
        filename: 'evil.js',
        contentType: 'text/javascript',
      });

    expect(res.status).toBe(400);
  });
});
