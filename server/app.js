const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');

/**
 * Express app factory (kept free of mongoose.connect and app.listen so that
 * supertest can drive it against an in-memory MongoDB in the test suite).
 */
const app = express();

// Middleware
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json());
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

// Import routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/practice', require('./routes/practiceRoutes'));
app.use('/api/streaks', require('./routes/streakRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/photos', require('./routes/photoRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
