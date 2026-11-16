/* Debug: multipart image-only message -> print full response body */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-do-not-use-in-production';
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('dbg');
  await mongoose.connect(process.env.MONGO_URI);
  const app = require('/home/z/my-project/SkillForge/server/app');
  const request = require('supertest');

  // register two users + friendship
  const u1 = await request(app).post('/api/auth/register').send({ username: 'a1', email: 'a1@x.com', password: 'Passw0rd!123' });
  const u2 = await request(app).post('/api/auth/register').send({ username: 'b1', email: 'b1@x.com', password: 'Passw0rd!123' });
  const User = require('/home/z/my-project/SkillForge/server/models/User');
  await User.updateOne({ _id: u1.body.user._id }, { $addToSet: { friends: u2.body.user._id } });
  await User.updateOne({ _id: u2.body.user._id }, { $addToSet: { friends: u1.body.user._id } });

  const imgPath = path.join('/tmp', 'dbg.png');
  fs.writeFileSync(imgPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

  const res = await request(app)
    .post('/api/messages')
    .set('Authorization', `Bearer ${u1.body.token}`)
    .field('recipientId', u2.body.user._id)
    .attach('image', imgPath);

  console.log('STATUS:', res.status);
  console.log('BODY:', JSON.stringify(res.body, null, 2).slice(0, 1200));

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
})().catch((e) => { console.error('ERR', e); process.exit(1); });
