require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const config = require('./config/env');

// Fail fast (in production) instead of silently booting with insecure defaults.
// config/env.js has already validated JWT_SECRET / MONGO_URI by this point.

const app = require('./app');
const { initSocket } = require('./socket');

mongoose
  .connect(config.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Please make sure MongoDB is running and accessible');
  });

if (require.main === module) {
  const PORT = config.PORT;
  // R26: wrap the Express app in an http.Server so Socket.IO can attach.
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} (REST + Socket.IO)`));
}

module.exports = app;
