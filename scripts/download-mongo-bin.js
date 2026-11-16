// Resolves mongodb-memory-server-core from the server workspace so the
// script works from any checkout.
const path = require('path');
const { MongoBinary } = require(path.join(__dirname, '..', 'server', 'node_modules', 'mongodb-memory-server-core'));

(async () => {
  console.log('Pre-downloading MongoDB binary for mongodb-memory-server...');
  const path = await MongoBinary.getPath({
    version: '7.0.14',
  });
  console.log('Binary ready at:', path);
  process.exit(0);
})().catch((err) => {
  console.error('Download failed:', err.message);
  process.exit(1);
});
