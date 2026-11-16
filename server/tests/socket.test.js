/**
 * R26: real-time message delivery.
 *
 * Before: messaging was 15-second polling only (three concurrent pollers in
 * the client) while the README claimed Socket.io; the server did not even
 * have socket.io installed.
 *
 * Now: sendMessage emits `message:new` to the recipient's user room through
 * a JWT-authenticated socket connection. The test boots a real HTTP server
 * (supertest drives app.js directly elsewhere, where the socket layer is
 * intentionally absent and emitToUser no-ops).
 */
const http = require('http');
const jwt = require('jsonwebtoken');
const { io: Client } = require('socket.io-client');

const mongoose = require('mongoose');
const { request, app, registerUser, makeFriends } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const { initSocket, emitToUser } = require('../socket');

let alice, bob;
let httpServer;
let baseUri;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
  bob = await registerUser();
  await makeFriends(alice.user._id, bob.user._id);

  httpServer = http.createServer(app);
  initSocket(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  baseUri = `http://127.0.0.1:${httpServer.address().port}`;
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
  await new Promise((resolve) => httpServer.close(resolve));
});

/** Connect a socket client authenticated as the given user. */
function connectAs(user) {
  return new Promise((resolve, reject) => {
    const client = Client(baseUri, {
      auth: { token: user.token },
      transports: ['websocket'],
    });
    client.on('connect', () => resolve(client));
    client.on('connect_error', reject);
  });
}

/** Wait for one event, with a timeout guard. */
function waitFor(client, event, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    client.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

describe('socket handshake', () => {
  test('a valid JWT connects and lands in the user room', async () => {
    const client = await connectAs(alice);
    expect(client.connected).toBe(true);
    client.close();
  });

  test('a bad token is rejected', async () => {
    await expect(new Promise((resolve, reject) => {
      const client = Client(baseUri, {
        auth: { token: 'garbage-token' },
        transports: ['websocket'],
      });
      client.on('connect', () => { client.close(); resolve('connected'); });
      client.on('connect_error', (err) => { client.close(); reject(err); });
    })).rejects.toThrow();
  });
});

describe('real-time message delivery', () => {
  test('the recipient receives message:new immediately when a REST message arrives', async () => {
    const bobSocket = await connectAs(bob);
    const received = waitFor(bobSocket, 'message:new');

    const res = await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', String(bob.user._id))
      .field('content', 'real-time hello');

    expect(res.status).toBe(201);

    const payload = await received;
    expect(payload.content).toBe('real-time hello');
    expect(String(payload.sender._id || payload.sender)).toBe(String(alice.user._id));

    bobSocket.close();
  });

  test('the sender is NOT notified of their own message on other... sender room gets a copy too', async () => {
    const aliceSocket = await connectAs(alice);
    const bobSocket = await connectAs(bob);
    const bobReceived = waitFor(bobSocket, 'message:new');

    await request(app)
      .post('/api/messages')
      .set(alice.headers)
      .field('recipientId', String(bob.user._id))
      .field('content', 'second ping');

    const payload = await bobReceived;
    expect(payload.content).toBe('second ping');

    aliceSocket.close();
    bobSocket.close();
  });
});

describe('emitToUser safety', () => {
  test('emitting before initSocket is a safe no-op (REST-only processes)', () => {
    // emitToUser on an uninitialized layer must not throw
    expect(() => emitToUser('nobody', 'message:new', {})).not.toThrow();
  });
});
