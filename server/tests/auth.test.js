const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { request, app, registerUser } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('Authentication API', () => {
  test('POST /api/auth/register creates a user and returns a token', async () => {
    const suffix = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: `authuser_${suffix}`,
        email: `authuser_${suffix}@example.com`,
        password: 'Passw0rd!123',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(`authuser_${suffix}@example.com`);
    // The password must never leak in the response body
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/login returns a token whose payload contains an "id" claim (C5 backend)', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    const decoded = jwt.decode(res.body.token);
    expect(decoded.id).toBeTruthy();
    // ...and the id claim must reference the same account
    const User = require('../models/User');
    const dbUser = await User.findOne({ email: payload.email });
    expect(decoded.id).toBe(dbUser._id.toString());
  });

  test('POST /api/auth/login rejects wrong credentials', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'wrong-password' });
    expect(res.status).toBe(400);
  });
});

describe('C1: no hard-coded JWT fallback secret', () => {
  afterEach(() => {
    // Restore the deterministic test env configured in tests/setupEnv.js
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-only-jwt-secret-do-not-use-in-production';
  });

  test('a token forged with the old hard-coded "supersecretkey" secret is rejected', async () => {
    const forged = jwt.sign({ id: new mongoose.Types.ObjectId().toString() }, 'supersecretkey', {
      expiresIn: '1d',
    });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  test('a token signed with the configured JWT_SECRET is accepted', async () => {
    const { user } = await registerUser();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id);
  });

  test('config/env.js refuses to boot in production without JWT_SECRET', () => {
    jest.isolateModules(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      expect(() => require('../config/env')).toThrow(/JWT_SECRET/);
    });
  });

  test('config/env.js falls back to a random per-boot secret in development, never a hard-coded one', () => {
    jest.isolateModules(() => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      const config = require('../config/env');
      // Random 32-byte hex secret - 64 chars, definitely not "supersecretkey"
      expect(config.JWT_SECRET).toHaveLength(64);
      expect(config.JWT_SECRET).not.toBe('supersecretkey');
    });
  });
});
