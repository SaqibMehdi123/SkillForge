// Deterministic test environment - loaded before any module under test.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-do-not-use-in-production';
