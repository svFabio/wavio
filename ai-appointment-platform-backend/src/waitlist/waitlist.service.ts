import { Injectable, Logger } from '@nestjs/common';
import { WaitlistRepository } from './waitlist.repository';
import { EventsService } from '../events/events.service';
import { NegocioService } from '../negocio/negocio.service';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly waitlistRepository: WaitlistRepository,
    private readonly eventsService: EventsService,
    private readonly negocioService: NegocioService,
  ) {}

  async addToWaitlist(
    negocioId: number,
    data: {
      clienteNombre: string;
      clienteTelefono: string;
      servicioId?: number;
      fechaPreferida: Date;
      horarioPreferido?: string;
    },
  ): Promise<{ id: number; message: string }> {
    const result = await this.waitlistRepository.addToWaitlist(negocioId, data);

    this.logger.log(
      `Added ${data.clienteNombre} to waitlist for ${data.fechaPreferida.toISOString()}`,
    );

    return {
      id: result.id,
      message:
        'Te has unido a la lista de espera. Te notificaremos cuando haya un espacio disponible.',
    };
  }

  async notifyAvailableSlot(negocioId: number, fecha: Date): Promise<number> {
    const pendingEntries = await this.waitlistRepository.getPendingForDate(negocioId, fecha);

    if (pendingEntries.length === 0) return 0;

    const negocio = await this.negocioService.findByIdForInternal(negocioId);
    if (!negocio?.waAccessToken || !negocio.waPhoneNumberId) return 0;

    let notified = 0;

    for (const entry of pendingEntries) {
      try {
        const mensaje =
          `Hola ${entry.clienteNombre}! 🎉\n\n` +
          `Se ha liberado un espacio para el ${fecha.toLocaleDateString('es-ES')}.\n\n` +
          `${entry.horarioPreferido ? `⏰ Horario preferido: ${entry.horarioPreferido}\n` : ''}` +
          `¿Deseas agendar tu cita? Responde SÍ para confirmar.`;

        await this.eventsService.sendWhatsAppMessage(
          {
            waAccessToken: negocio.waAccessToken,
            waPhoneNumberId: negocio.waPhoneNumberId,
          },
          entry.clienteTelefono,
          mensaje,
        );

        await this.waitlistRepository.markNotified(entry.id);
        notified++;
      } catch (error) {
        this.logger.error(`Failed to notify waitlist entry ${entry.id}: ${error}`);
      }
    }

    this.logger.log(`Notified ${notified} waitlist entries for ${fecha.toISOString()}`);
    return notified;
  }

  async getAll(negocioId: number): Promise<unknown[]> {
    return this.waitlistRepository.getAll(negocioId);
  }

  async getWaitlistCount(negocioId: number): Promise<number> {
    return this.waitlistRepository.getWaitlistCount(negocioId);
  }
}
