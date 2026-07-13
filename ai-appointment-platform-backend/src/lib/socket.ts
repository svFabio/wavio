import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import pino from 'pino';

const logger = pino();

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  if (io) return io;

  const allowedOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map((s: string) => s.trim())
    : [];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token as string, env.JWT_SECRET) as { negocioId: number };
      socket.data.negocioId = decoded.negocioId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const negocioId = socket.data.negocioId;
    socket.join(negocioId.toString());
    logger.info({ socketId: socket.id, negocioId }, 'Cliente autenticado al Socket');
  });

  return io;
};

export const getSocket = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocket primero.');
  }
  return io;
};
