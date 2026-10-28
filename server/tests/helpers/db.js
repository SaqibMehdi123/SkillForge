const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/** Start an in-memory MongoDB once per test process. */
async function startMongo() {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri('skillforge_test');
  }
  return process.env.MONGO_URI;
}

async function stopMongo() {
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
}

module.exports = { startMongo, stopMongo };
