const { MongoBinary } = require('/home/z/my-project/SkillForge/server/node_modules/mongodb-memory-server-core');

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
