const { Server } = require('socket.io');
const socketAuth = require('../middlewares/socketAuth');

let io;

module.exports = {
  initSocket: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true, // MUST BE TRUE to receive cookies
      },
    });

    // Authenticate client sockets
    io.use(socketAuth);

    io.on('connection', (socket) => {
      const userId = socket.user?.id || socket.user?._id;

      if (userId) {
        socket.join(`user:${userId}`);
        io.emit('user:online', { userId });
      }

      socket.on('disconnect', () => {
        if (userId) {
          io.emit('user:offline', { userId });
        }
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io has not been initialized!');
    }
    return io;
  },
};