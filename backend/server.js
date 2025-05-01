const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('rate-limiter-flexible');
const connectDB = require('./config/db');
const socketEvents = require('./utils/socketEvents');
const rateLimiterMiddleware = require('./middleware/rateLimiter');
const mongoose = require('mongoose');
const SocketServer = require('./socket/socketServer');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Update route-specific rate limiters
app.use('/api/users/login', rateLimiterMiddleware('login'));
app.use('/api/practice/upload-snap', rateLimiterMiddleware('snapUpload'));
app.use('/api/practice/validate-session', rateLimiterMiddleware('practiceSession'));
app.use('/api/users/social', rateLimiterMiddleware('socialActions'));
app.use('/api', rateLimiterMiddleware('general'));

// Import routes
const userRoutes = require('./routes/userRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const skillCategoryRoutes = require('./routes/skillCategoryRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/skill-categories', skillCategoryRoutes);
app.use('/api/achievements', achievementRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SkillForge API' });
});

// Socket.io setup
const http = require('http');
const server = http.createServer(app);
const socketServer = new SocketServer(server);

// Add socket instance to req object
app.use((req, res, next) => {
  req.io = socketServer.io;
  next();
});

// Initialize socket events
socketEvents(socketServer.io);

let isShuttingDown = false;

// Graceful shutdown
function shutdownServer() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down server...');
  socketServer.close(() => {
    console.log('Socket.IO connections closed');
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  // Force close after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Error handlers
process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdownServer();
});
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  shutdownServer();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, io: socketServer.io };
