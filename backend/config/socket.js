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

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // Join user room for receiving real-time direct messages
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined room: ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from socket:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };