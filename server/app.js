const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const { authLimiter, apiLimiter, uploadLimiter } = require('./middleware/rateLimit');

/**
 * Express app factory (kept free of mongoose.connect and app.listen so that
 * supertest can drive it against an in-memory MongoDB in the test suite).
 */
const app = express();

// Middleware
// S15: baseline security headers. CORP is cross-origin so the SPA on its own
// origin can still embed /uploads images.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
// S4: rate limiting - generous global bucket, strict on auth, moderate on uploads.
app.use(apiLimiter);
app.use(express.json({ limit: '25mb' })); // S9: base64 photos travel as JSON
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const messagesUploadsDir = path.join(__dirname, 'uploads/messages');
const avatarsDir = path.join(__dirname, 'uploads/avatars');
const photosDir = path.join(__dirname, 'uploads/photos');

for (const dir of [uploadsDir, messagesUploadsDir, avatarsDir, photosDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Basic route
app.get('/', (req, res) => {
  res.send('SkillForge API is running');
});

// Import routes (auth gets its own strict limiter - S4)
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/practice', require('./routes/practiceRoutes'));
app.use('/api/streaks', require('./routes/streakRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/media', uploadLimiter, require('./routes/mediaRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/messages', uploadLimiter, require('./routes/messageRoutes'));
app.use('/api/photos', uploadLimiter, require('./routes/photoRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
