const socketEvents = (io) => {
  io.on('connection', (socket) => {
    // Join user's room for private notifications
    socket.on('join', (userId) => {
      socket.join(userId);
    });

    // Handle practice session start
    socket.on('practiceStart', ({ userId, skillCategory }) => {
      socket.to(userId).emit('practiceStarted', { skillCategory });
    });

    // Handle friend request notifications
    socket.on('friendRequest', ({ from, to }) => {
      socket.to(to).emit('newFriendRequest', { from });
    });

    // Handle achievement notifications
    socket.on('achievementEarned', ({ userId, achievement }) => {
      socket.to(userId).emit('newAchievement', { achievement });
    });

    // Handle practice session completion
    socket.on('practiceComplete', ({ userId, practice }) => {
      socket.broadcast.emit('friendPracticeComplete', { userId, practice });
    });
  });
};

module.exports = socketEvents;
