/**
 * B1 + B2: `Document.remove()` was removed in Mongoose 8, so
 * DELETE /api/media/:id and DELETE /api/notifications/:id both returned
 * "500 media.remove is not a function" and nothing could ever be deleted.
 *
 * These tests pin down: delete works, authorization is enforced, and
 * mark-as-read still behaves for notifications.
 */
const mongoose = require('mongoose');
const Media = require('../models/Media');
const Notification = require('../models/Notification');
const { request, app, registerUser, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice, bob;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
  bob = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('B1: DELETE /api/media/:id', () => {
  test('deletes the owner media and returns 200', async () => {
    const media = await Media.create({
      user: alice.user._id,
      url: `uploads/photos/${uniq()}.png`,
      type: 'photo',
    });

    const res = await request(app)
      .delete(`/api/media/${media._id}`)
      .set(alice.headers);

    expect(res.status).toBe(200);
    const gone = await Media.findById(media._id);
    expect(gone).toBeNull();
  });

  test("another user's media is 404 and is not deleted", async () => {
    const media = await Media.create({
      user: alice.user._id,
      url: `uploads/photos/${uniq()}.png`,
      type: 'photo',
    });

    const res = await request(app)
      .delete(`/api/media/${media._id}`)
      .set(bob.headers);

    expect(res.status).toBe(404);
    const stillThere = await Media.findById(media._id);
    expect(stillThere).not.toBeNull();
  });

  test('requires authentication', async () => {
    const res = await request(app).delete(`/api/media/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });
});

describe('B2: DELETE /api/notifications/:id', () => {
  test('deletes the owner notification and returns 200', async () => {
    const notification = await Notification.create({
      user: alice.user._id,
      type: 'friend_request',
      message: 'Bob sent you a request',
    });

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set(alice.headers);

    expect(res.status).toBe(200);
    const gone = await Notification.findById(notification._id);
    expect(gone).toBeNull();
  });

  test("another user's notification is 404 and is not deleted", async () => {
    const notification = await Notification.create({
      user: alice.user._id,
      type: 'friend_request',
      message: 'Bob sent you a request',
    });

    const res = await request(app)
      .delete(`/api/notifications/${notification._id}`)
      .set(bob.headers);

    expect(res.status).toBe(404);
    const stillThere = await Notification.findById(notification._id);
    expect(stillThere).not.toBeNull();
  });

  test('mark-as-read works and is scoped to the owner', async () => {
    const notification = await Notification.create({
      user: bob.user._id,
      type: 'achievement',
      message: 'First achievement unlocked',
    });

    const forbidden = await request(app)
      .post(`/api/notifications/${notification._id}/read`)
      .set(alice.headers);
    expect(forbidden.status).toBe(404);

    const res = await request(app)
      .post(`/api/notifications/${notification._id}/read`)
      .set(bob.headers);
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });
});
