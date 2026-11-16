/**
 * R26: real-time messaging (server side).
 *
 * The audit confirmed messaging was pure 15-second polling (three pollers!)
 * while the README claimed Socket.io. This module provides:
 *   - a JWT-authenticated handshake (same secret source as the REST API),
 *   - per-user rooms (`user:<id>`) so events fan out to all of a user's tabs,
 *   - emitToUser() as the single integration point - it no-ops when the
 *     socket layer is not attached (e.g. supertest drives app.js directly).
 *
 * The 15 s poll is demoted to a reconnect fallback, not removed.
 */
let io = null;

/**
 * Attach a Socket.IO server to an http.Server.
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');
  const config = require('../config/env');

  io = new Server(httpServer, {
    cors: { origin: config.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // One room per user id - every tab/device of that user receives events.
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      // Rooms clean up automatically on disconnect.
    });
  });

  return io;
}

/**
 * Emit an event to every open connection of a user. Safe to call before
 * initSocket (no-op) so REST-only processes and tests are unaffected.
 */
function emitToUser(userId, event, payload) {
  if (!io) return false;
  io.to(`user:${userId}`).emit(event, payload);
  return true;
}

/** Current socket server (or null when not initialized). */
function getIo() {
  return io;
}

module.exports = { initSocket, emitToUser, getIo };
