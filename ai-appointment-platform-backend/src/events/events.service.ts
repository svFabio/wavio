import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

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
}
