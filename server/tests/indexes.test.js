/**
 * P1: every hot query path scanned a whole collection.
 *   - getConversation/getConversations filter sender/recipient with a sort
 *     on createdAt - Message had NO indexes at all.
 *   - getHistory/getPracticePhotos/countDocuments filter user (+ completed)
 *     - PracticeSession had no index.
 *   - Media/Notification list endpoints filter user - no index.
 *   - getPendingRequests/getSentRequests filter recipient/sender + status -
 *     FriendRequest only had the unique {sender, recipient} pair.
 *
 * P2: list endpoints hydrated full Mongoose documents with no pagination
 *     and no .lean(); read-only endpoints now return plain objects.
 */
const mongoose = require('mongoose');
const Message = require('../models/Message');
const PracticeSession = require('../models/PracticeSession');
const Media = require('../models/Media');
const Notification = require('../models/Notification');
const FriendRequest = require('../models/FriendRequest');

function indexKeys(model, fieldSet) {
  const idx = model.schema.indexes().find(([, opts]) =>
    Object.entries(fieldSet).every(([k, v]) => opts[k] === undefined || opts[k] === v)
  );
  return idx;
}

function hasIndex(model, keys) {
  const expected = Object.keys(keys).sort().join(',');
  return model.schema.indexes().some(([definition]) => {
    const actual = Object.keys(definition).sort().join(',');
    return actual === expected;
  });
}

describe('P1: hot query paths have supporting indexes', () => {
  test('Message: { sender, recipient, createdAt } compound', () => {
    expect(hasIndex(Message, { sender: 1, recipient: 1, createdAt: -1 })).toBe(true);
  });

  test('Message: { recipient, createdAt } for the inbox direction', () => {
    expect(hasIndex(Message, { recipient: 1, createdAt: -1 })).toBe(true);
  });

  test('PracticeSession: { user, createdAt } and { user, completed }', () => {
    expect(hasIndex(PracticeSession, { user: 1, createdAt: -1 })).toBe(true);
    expect(hasIndex(PracticeSession, { user: 1, completed: 1 })).toBe(true);
  });

  test('Media and Notification: { user } lookups', () => {
    expect(hasIndex(Media, { user: 1 })).toBe(true);
    expect(hasIndex(Notification, { user: 1, createdAt: -1 })).toBe(true);
  });

  test('FriendRequest: recipient/status and sender/status for the request lists', () => {
    expect(hasIndex(FriendRequest, { recipient: 1, status: 1 })).toBe(true);
    expect(hasIndex(FriendRequest, { sender: 1, status: 1 })).toBe(true);
  });

  test('indexes actually materialize in the database', async () => {
    await startMongoAndConnect();
    // force index build
    await Message.init();
    await PracticeSession.init();
    const messageIndexes = await Message.collection.indexes();
    const flat = messageIndexes.map((i) => Object.keys(i.key).sort().join(','));
    expect(flat).toContain('createdAt,recipient,sender');
  });
});

let startMongoAndConnect;

beforeAll(() => {
  // models only - no server needed; connect lazily for the DB-level check
  const { startMongo, stopMongo } = require('./helpers/db');
  startMongoAndConnect = async () => {
    await startMongo();
    await mongoose.connect(process.env.MONGO_URI);
  };
});

afterAll(async () => {
  await mongoose.disconnect();
  const { stopMongo } = require('./helpers/db');
  await stopMongo();
});
