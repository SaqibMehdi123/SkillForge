const { MongoMemoryServer } = require('/home/z/my-project/SkillForge/server/node_modules/mongodb-memory-server-core');

(async () => {
  console.log('Creating MongoMemoryServer...');
  const t0 = Date.now();
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27077, ip: '127.0.0.1' },
  });
  console.log('Started in', Date.now() - t0, 'ms at', mongod.getUri());
  const { MongoClient } = require('/home/z/my-project/SkillForge/server/node_modules/mongodb');
  const client = new MongoClient(mongod.getUri());
  await client.connect();
  await client.db('t').collection('x').insertOne({ a: 1 });
  console.log('insert OK');
  await client.close();
  await mongod.stop();
  console.log('ALL OK');
  process.exit(0);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
