import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyJwt } from '../common/utils/jwt';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

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
