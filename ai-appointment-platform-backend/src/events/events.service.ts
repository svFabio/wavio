import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { enviarMensaje, WaCredentials } from '../lib/whatsapp';
import pino from 'pino';

const logger = pino({ name: 'events-service' });

@Injectable()
export class EventsService {
  constructor(private readonly gateway: EventsGateway) {}

  emitCambioCitas(negocioId: number, data?: Record<string, unknown>): void {
    this.gateway.server.to(`negocio:${negocioId}`).emit('cambio-citas', data);
  }

  emitNuevaCita(negocioId: number, data: Record<string, unknown>): void {
    this.gateway.server.to(`negocio:${negocioId}`).emit('nueva-cita', data);
  }

  emitNuevoMensaje(negocioId: number, data: Record<string, unknown>): void {
    this.gateway.server.to(`negocio:${negocioId}`).emit('nuevo-mensaje', data);
  }

  emitConversacionEliminada(negocioId: number, data: Record<string, unknown>): void {
    this.gateway.server.to(`negocio:${negocioId}`).emit('conversacion-eliminada', data);
  }

  async sendWhatsAppMessage(
    waCreds: WaCredentials,
    to: string,
    message: string,
  ): Promise<void> {
    try {
      await enviarMensaje(waCreds, to, message);
    } catch (error) {
      logger.error({ error, to }, '[Events] Error enviando mensaje WhatsApp');
    }
  }
}
