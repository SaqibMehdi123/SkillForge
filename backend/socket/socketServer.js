const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const SocketServer = require('./socket/socketServer');

// Load environment variables
dotenv.config();

class AppServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.socketServer = new SocketServer(this.server);

    this.setupMiddleware();
    this.setupDatabase();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan('dev'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupDatabase() {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
      .then(() => console.log('MongoDB connected'))
      .catch(err => console.error('MongoDB connection error:', err));
  }

  setupRoutes() {
    const practiceRoutes = require('../routes/practiceRoutes');
    const rewardRoutes = require('../routes/rewardRoutes');

    this.app.use('/api/practices', practiceRoutes);
    this.app.use('/api/rewards', rewardRoutes);
  }

  start(port = process.env.PORT || 5000) {
    this.server.listen(port, () => {
      console.log(`App server running on port ${port}`);
    });
  }

  stop() {
    this.server.close(() => {
      console.log('App server stopped');
    });
    this.socketServer.close();
  }
}

module.exports = AppServer;
