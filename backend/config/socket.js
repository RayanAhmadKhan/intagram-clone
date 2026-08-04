const { Server } = require('socket.io');
const socketAuth = require('../middlewares/socketAuth');

let io;

const clientOrigin = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : true;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true, 
    },
  });

  if (socketAuth) {
    io.use(socketAuth);
  }

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id;

    if (userId) {

      socket.join(userId.toString());
      socket.join(`user:${userId}`);
      io.emit('user:online', { userId });
    }

    socket.on('join', (roomUserId) => {
      if (roomUserId) {
        socket.join(roomUserId.toString());
        socket.join(`user:${roomUserId}`);
      }
    });

    socket.on('disconnect', () => {
      if (userId) {
        io.emit('user:offline', { userId });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };