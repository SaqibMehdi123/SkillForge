const activeConnections = new Map();

class SocketManager {
  static initialize(io) {
    if (!io) throw new Error('Socket.io instance required');

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.use(([event, ...args], next) => {
        if (!socket.userId && event !== 'join') {
          return next(new Error('Authentication required'));
        }
        next();
      });

      socket.on('join', (userId) => {
        if (!userId) return;
        socket.userId = userId;
        activeConnections.set(socket.id, userId);
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socket.on('disconnect', () => {
        const userId = activeConnections.get(socket.id);
        if (userId) {
          activeConnections.delete(socket.id);
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  }

  static getActiveUsers() {
    return [...new Set(activeConnections.values())];
  }

  static getUserSockets(io, userId) {
    return io.sockets.adapter.rooms.get(userId) || new Set();
  }
}

module.exports = SocketManager;
