const mongoose = require('mongoose');
const { request, app, registerUser, TINY_PNG_BASE64 } = require('./helpers/api');
const { startMongo, stopMongo } = require('./helpers/db');

let alice;

beforeAll(async () => {
  await startMongo();
  await mongoose.connect(process.env.MONGO_URI);
  alice = await registerUser();
});

afterAll(async () => {
  await mongoose.disconnect();
  await stopMongo();
});

describe('C2: photo endpoints must not crash on ObjectId construction', () => {
  test('POST /api/photos stores a photo and its Media record (used to 500)', async () => {
    const res = await request(app)
      .post('/api/photos')
      .set(alice.headers)
      .send({
        imageData: TINY_PNG_BASE64,
        taskName: 'Guitar practice',
        taskCategory: 'music',
        taskPriority: 'high',
        timestamp: new Date().toISOString(),
      });

    // Before the C2 fix this returned 500 with
    // "Class constructor ObjectId cannot be invoked without 'new'"
    expect(res.status).toBe(201);
    expect(res.body.photo).toBeTruthy();
    expect(res.body.photo.mediaId).toBeTruthy();
    // No hard-coded localhost in API responses
    expect(JSON.stringify(res.body)).not.toContain('http://localhost:5000');
  });

  test('GET /api/photos lists the uploaded photo', async () => {
    const res = await request(app).get('/api/photos').set(alice.headers);

    expect(res.status).toBe(200);
    const photo = res.body.photos.find((p) => p.taskName === 'Guitar practice');
    expect(photo).toBeTruthy();
    expect(photo.userId).toBe(alice.user._id);
  });

  test('DELETE /api/photos/:id removes only the owners photo', async () => {
    const created = await request(app)
      .post('/api/photos')
      .set(alice.headers)
      .send({ imageData: TINY_PNG_BASE64, taskName: 'To delete' });

    const mediaId = created.body.photo.mediaId;

    const someoneElse = await registerUser();
    const forbidden = await request(app)
      .delete(`/api/photos/${mediaId}`)
      .set(someoneElse.headers);
    expect(forbidden.status).toBe(404);

    const res = await request(app).delete(`/api/photos/${mediaId}`).set(alice.headers);
    expect(res.status).toBe(200);
  });
});
