const socketIo = require('socket.io');
const logger = require('../utils/logger');

let io;

module.exports = {
  /**
   * Initialize Socket.IO with the Express HTTP server
   */
  init: (httpServer) => {
    io = socketIo(httpServer, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      logger.info(`🔌 Client connected to Socket.IO Hub [ID: ${socket.id}]`);

      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected [ID: ${socket.id}]`);
      });
    });

    return io;
  },

  /**
   * Get the initialized Socket.IO instance
   */
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO has not been initialized!');
    }
    return io;
  }
};
