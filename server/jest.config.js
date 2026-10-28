module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  // Keep the noisy controller console.log output out of test reports
  silent: false,
};
