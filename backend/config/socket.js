// const { Server } = require('socket.io');
// const socketAuth = require('../middlewares/socketAuth');

// let io;

// module.exports = {
//   initSocket: (server) => {
//     io = new Server(server, {
//       cors: {
//         origin: process.env.CLIENT_URL || 'http://localhost:5173',
//         methods: ['GET', 'POST'],
//         credentials: true, // MUST BE TRUE to receive cookies
//       },
//     });

//     // Authenticate client sockets
//     io.use(socketAuth);

//     io.on('connection', (socket) => {
//       const userId = socket.user?.id || socket.user?._id;

//       if (userId) {
//         socket.join(`user:${userId}`);
//         io.emit('user:online', { userId });
//       }

//       socket.on('disconnect', () => {
//         if (userId) {
//           io.emit('user:offline', { userId });
//         }
//       });
//     });

//     return io;
//   },
//   getIO: () => {
//     if (!io) {
//       throw new Error('Socket.io has not been initialized!');
//     }
//     return io;
//   },
// };
const { Server } = require('socket.io');
const socketAuth = require('../middlewares/socketAuth');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true, // MUST BE TRUE to receive cookies
    },
  });

  // Authenticate client sockets
  if (socketAuth) {
    io.use(socketAuth);
  }

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?._id;

    if (userId) {
      // Join user-specific room for notifications, follow requests, and messages
      socket.join(userId.toString());
      socket.join(`user:${userId}`);
      io.emit('user:online', { userId });
    }

    // Explicit room join listener for safety
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