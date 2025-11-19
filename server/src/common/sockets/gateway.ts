import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { getEnv } from '../../env';
import { logger } from '../utils/logger';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const env = getEnv();

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info({ userId: user?.userId }, 'User connected to Socket.IO');

    socket.on('join:thread', (threadId: string) => {
      socket.join(`thread:${threadId}`);
      logger.debug({ threadId, userId: user?.userId }, 'User joined thread');
    });

    socket.on('leave:thread', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
      logger.debug({ threadId, userId: user?.userId }, 'User left thread');
    });

    socket.on('message:send', (data: { threadId: string; text: string }) => {
      io.to(`thread:${data.threadId}`).emit('message:new', {
        threadId: data.threadId,
        text: data.text,
        senderId: user?.userId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('message:read', (data: { threadId: string; messageId: string }) => {
      io.to(`thread:${data.threadId}`).emit('message:read', {
        messageId: data.messageId,
        readBy: user?.userId,
      });
    });

    socket.on('disconnect', () => {
      logger.info({ userId: user?.userId }, 'User disconnected from Socket.IO');
    });
  });

  return io;
}
