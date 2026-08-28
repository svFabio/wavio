import { Inject, Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';
import { verifyJwt } from '../common/utils/jwt';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';
import { REDIS_CLIENT } from '../lib/redis/redis.module';

const logger = createLogger('events-gateway');

@Injectable()
@WebSocketGateway({
  cors: {
    origin: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',').map((s: string) => s.trim())
      : env.NODE_ENV !== 'production',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis | null) {}

  afterInit(): void {
    if (!this.redisClient || this.redisClient.status !== 'ready') {
      logger.warn('Redis not available — Socket.IO running without Redis adapter');
      return;
    }

    try {
      const pubClient = this.redisClient;
      const subClient = pubClient.duplicate();
      this.server.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter configured');
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : 'unknown' },
        'Failed to configure Socket.IO Redis adapter — running without it',
      );
    }
  }

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string) || (client.handshake.query?.token as string);
    const negocioIdRaw = client.handshake.auth?.negocioId || client.handshake.query?.negocioId;

    if (!token || !negocioIdRaw) {
      client.disconnect();
      return;
    }

    const negocioId = Number(negocioIdRaw);
    if (isNaN(negocioId)) {
      client.disconnect();
      return;
    }

    try {
      const decoded = verifyJwt(token);
      const memberships = decoded.negocios ?? [];
      if (!memberships.some((n) => n.negocioId === negocioId)) {
        logger.warn({ socketId: client.id, negocioId }, 'Cliente intento unirse a otro negocio');
        client.disconnect();
        return;
      }
      client.data.userId = decoded.id;
      client.data.negocioId = negocioId;
      client.join(`negocio:${negocioId}`);
      logger.info({ socketId: client.id, negocioId }, 'Cliente conectado');
    } catch (error) {
      logger.warn(
        { socketId: client.id, error: error instanceof Error ? error.message : 'unknown' },
        'Cliente rechazado por token inválido',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const { negocioId } = client.data;
    if (negocioId) {
      client.leave(`negocio:${negocioId}`);
    }
    logger.info({ socketId: client.id }, 'Cliente desconectado');
  }
}
