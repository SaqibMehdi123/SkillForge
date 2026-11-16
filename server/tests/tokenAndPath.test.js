/**
 * S8: authController and middleware/auth both read process.env.JWT_SECRET
 *     directly while the C1 fix put the random dev fallback ONLY in
 *     config/env.js. In a dev boot without .env, jwt.sign(payload, undefined)
 *     throws -> register/login 500, and the random-per-boot protection is
 *     decorative. Two sources of truth also drift once rotation happens.
 *
 * S12: photoService.deletePhotoByFilename checked only the '<userId>_'
 *     prefix; a filename like '<userId>_../../../secret.txt' still resolved
 *     OUTSIDE the uploads directory after path.join normalization and got
 *     unlinked.
 */
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const photoService = require('../services/photoService');
const { registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

const serverRoot = path.join(__dirname, '..');

beforeAll(async () => {
  await startMongo();
  await require('mongoose').connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await require('mongoose').disconnect();
  await stopMongo();
});

describe('S12: deletePhotoByFilename cannot escape the uploads directory', () => {
  test('a traversal filename after the user prefix is refused and the target survives', async () => {
    const { user } = await registerUser();

    // The victim file lives OUTSIDE the uploads tree
    const victimPath = path.join(serverRoot, 'sneaky-target.txt');
    fs.writeFileSync(victimPath, 'do not delete me');

    try {
      // UPLOAD_DIR is server/uploads/photos; segments after the prefix:
      // '<id>_..' pops via the first '..', then '..' pops photos, '..' pops
      // uploads -> the target resolves to server/sneaky-target.txt.
      // (Verified the old code deleted it through this exact path.)
      const tricky = `${user._id}_../../../../sneaky-target.txt`;
      const result = await photoService.deletePhotoByFilename(tricky, String(user._id));

      expect(result).toBe(false);
      expect(fs.existsSync(victimPath)).toBe(true);
    } finally {
      if (fs.existsSync(victimPath)) fs.unlinkSync(victimPath);
    }
  });

  test('a legitimate owned file still deletes', async () => {
    const { user } = await registerUser();
    const photosDir = path.join(serverRoot, 'uploads', 'photos');
    fs.mkdirSync(photosDir, { recursive: true });
    const legit = path.join(photosDir, `${user._id}_12345.png`);
    fs.writeFileSync(legit, 'png');

    const result = await photoService.deletePhotoByFilename(`${user._id}_12345.png`, String(user._id));
    expect(result).toBe(true);
    expect(fs.existsSync(legit)).toBe(false);
  });
});

describe('S8: JWT secret has exactly one source of truth (config)', () => {
  test('authController signs with config.JWT_SECRET, not process.env directly', () => {
    const src = fs.readFileSync(path.join(serverRoot, 'controllers', 'authController.js'), 'utf8');
    expect(src).toMatch(/config\.JWT_SECRET/);
    expect(src).not.toMatch(/process\.env\.JWT_SECRET/);
  });

  test('middleware/auth verifies with config.JWT_SECRET, not process.env directly', () => {
    const src = fs.readFileSync(path.join(serverRoot, 'middleware', 'auth.js'), 'utf8');
    expect(src).toMatch(/config\.JWT_SECRET/);
    expect(src).not.toMatch(/process\.env\.JWT_SECRET/);
  });

  test('the config secret round-trips through sign/verify', () => {
    const config = require('../config/env');
    const token = jwt.sign({ id: 'abc123' }, config.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, config.JWT_SECRET);
    expect(decoded.id).toBe('abc123');
  });
});
