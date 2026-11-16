/**
 * B14: the profile route only existed as GET /api/users/users/:id (doubled
 *      segment); the natural GET /api/users/:id hit nothing.
 * B17: acceptFriendRequest never checked status - a REJECTED request could
 *      be silently re-activated to accepted, and accepted requests could be
 *      re-accepted.
 * B18: removeFriend accepted garbage ids (CastError 500), reported success
 *      for non-friends, and left the FriendRequest row 'accepted' - so two
 *      users could NEVER re-add each other after unfriending.
 */
const mongoose = require('mongoose');
const { request, app, registerUser, uniq } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

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

/** Two brand-new users per test so request state never leaks between tests */
async function freshPair() {
  const [u1, u2] = await Promise.all([registerUser(), registerUser()]);
  return [u1, u2];
}

/** sender sends a friend request to recipient, returns the request document */
async function sendRequest(sender, recipient) {
  const res = await request(app)
    .post('/api/friends/requests')
    .set(sender.headers)
    .send({ recipientId: String(recipient.user._id) });
  expect(res.status).toBe(201);
  return res.body.data;
}

describe('B14: natural profile route', () => {
  test('GET /api/users/:id returns the user', async () => {
    const res = await request(app)
      .get(`/api/users/${bob.user._id}`)
      .set(alice.headers);

    expect(res.status).toBe(200);
    expect(String(res.body._id || res.body.id)).toBe(String(bob.user._id));
    expect(res.body.username).toBe(bob.user.username);
    expect(res.body.password).toBeUndefined();
  });

  test('a garbage id is a 400, not a CastError 500', async () => {
    const res = await request(app).get('/api/users/not-an-id').set(alice.headers);
    expect(res.status).toBe(400);
  });
});

describe('B17: accept only pending requests', () => {
  test('a rejected request cannot be re-accepted into a friendship', async () => {
    const [dan, eve] = await freshPair();
    const reqDoc = await sendRequest(dan, eve);

    // eve rejects
    const rejected = await request(app)
      .put(`/api/friends/requests/${reqDoc._id}/reject`)
      .set(eve.headers);
    expect(rejected.status).toBe(200);

    // ...then tries to accept the same request later
    const res = await request(app)
      .put(`/api/friends/requests/${reqDoc._id}/accept`)
      .set(eve.headers);

    expect(res.status).toBe(409);
    const [a, b] = await Promise.all([
      User.findById(dan.user._id).lean(),
      User.findById(eve.user._id).lean(),
    ]);
    expect(a.friends.map(String)).not.toContain(String(eve.user._id));
    expect(b.friends.map(String)).not.toContain(String(dan.user._id));
  });

  test('accepting an already-accepted request is idempotent-conflict, not a re-add', async () => {
    const [dan, eve] = await freshPair();
    const reqDoc = await sendRequest(dan, eve);
    await request(app).put(`/api/friends/requests/${reqDoc._id}/accept`).set(eve.headers);

    const res = await request(app)
      .put(`/api/friends/requests/${reqDoc._id}/accept`)
      .set(eve.headers);
    expect(res.status).toBe(409);
  });

  test('a non-recipient cannot accept (authorization intact)', async () => {
    const [dan, eve] = await freshPair();
    const reqDoc = await sendRequest(dan, eve);
    const res = await request(app)
      .put(`/api/friends/requests/${reqDoc._id}/accept`)
      .set(dan.headers); // dan is the sender, not the recipient
    expect(res.status).toBe(403);
  });
});

describe('B18: removeFriend hygiene', () => {
  test('garbage friendId is a 400, not a CastError 500', async () => {
    const res = await request(app).delete('/api/friends/not-an-id').set(alice.headers);
    expect(res.status).toBe(400);
  });

  test('removing someone who is not a friend is a 404', async () => {
    const carol = await registerUser();
    const res = await request(app)
      .delete(`/api/friends/${carol.user._id}`)
      .set(alice.headers);
    expect(res.status).toBe(404);
  });

  test('after unfriending, both lists are clean and a re-request succeeds', async () => {
    const [dan, eve] = await freshPair();
    const reqDoc = await sendRequest(dan, eve);
    await request(app).put(`/api/friends/requests/${reqDoc._id}/accept`).set(eve.headers);

    const removed = await request(app)
      .delete(`/api/friends/${eve.user._id}`)
      .set(dan.headers);
    expect(removed.status).toBe(200);

    const [a, b] = await Promise.all([
      User.findById(dan.user._id).lean(),
      User.findById(eve.user._id).lean(),
    ]);
    expect(a.friends.map(String)).not.toContain(String(eve.user._id));
    expect(b.friends.map(String)).not.toContain(String(dan.user._id));

    // No stale accepted request row may survive the removal
    const stale = await FriendRequest.findOne({
      $or: [
        { sender: dan.user._id, recipient: eve.user._id },
        { sender: eve.user._id, recipient: dan.user._id },
      ],
    }).lean();
    expect(stale).toBeNull();

    // The old code then refused every future request with "already friends"
    const reAdd = await request(app)
      .post('/api/friends/requests')
      .set(dan.headers)
      .send({ recipientId: String(eve.user._id) });
    expect(reAdd.status).toBe(201);
  });
});
