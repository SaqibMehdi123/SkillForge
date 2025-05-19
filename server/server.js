require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Fallback: set env vars directly if not loaded
if (!process.env.MONGO_URI) process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/skillforge';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'supersecretkey';
if (!process.env.CLIENT_URL) process.env.CLIENT_URL = 'http://localhost:3000';

console.log('DEBUG MONGO_URI:', process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
console.log('MONGO_URI:', process.env.MONGO_URI);
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file!');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const messagesUploadsDir = path.join(__dirname, 'uploads/messages');
const avatarsDir = path.join(__dirname, 'uploads/avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(messagesUploadsDir)) {
  fs.mkdirSync(messagesUploadsDir);
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Add timeout for server selection
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Please make sure MongoDB is running and accessible');
  });

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 