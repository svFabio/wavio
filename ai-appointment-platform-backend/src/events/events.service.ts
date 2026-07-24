import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { WhatsAppService } from '../lib/whatsapp.service';
import type { WaCredentials } from '../lib/whatsapp';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly gateway: EventsGateway,
    private readonly whatsApp: WhatsAppService,
  ) {}

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

  async sendWhatsAppMessage(waCreds: WaCredentials, to: string, message: string): Promise<void> {
    await this.whatsApp.sendMessage(waCreds, to, message);
  }
}
