import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NoShowRepository } from './noshow.repository';
import { NegocioService } from '../negocio/negocio.service';
import { EventsService } from '../events/events.service';

const BLOCK_THRESHOLD = 3;

@Injectable()
export class NoShowService {
  private readonly logger = new Logger(NoShowService.name);

  constructor(
    private readonly noShowRepository: NoShowRepository,
    private readonly negocioService: NegocioService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Check for expired in-progress appointments and mark as no-show.
   * Runs every 30 minutes.
   */
  @Cron('*/30 * * * *')
  async checkExpiredAppointments(): Promise<void> {
    this.logger.debug('Checking for expired appointments…');

    try {
      const businesses = await this.noShowRepository.getActiveBusinessIds();
      for (const negocioId of businesses) {
        const expired = await this.noShowRepository.getExpiredInProgressAppointments(negocioId, 60);
        if (expired.length === 0) continue;

        for (const cita of expired) {
          await this.noShowRepository.markAsNoShow(cita.id);

          await this.noShowRepository.incrementNoShowCount(negocioId, cita.clienteTelefono);

          this.logger.log(`Marked cita ${cita.id} as NO_SHOW (expired in-progress)`);
        }

        const negocio = await this.negocioService.findByIdForInternal(negocioId);
        if (negocio?.waAccessToken && negocio.waPhoneNumberId) {
          // Si tuviéramos un teléfono de dueño diferente al bot, enviaríamos la notificación.
          // Como waPhoneNumberId es el bot, enviar un mensaje al mismo número fallará.
          // Omitimos el envío para evitar errores silenciosos.
          this.logger.log(
            `Omitiendo notificación al dueño (mismo número que el bot) para el negocio ${negocioId}`,
          );
        }
      }
      this.logger.debug('No-show check completed');
    } catch (error) {
      this.logger.error('No-show check failed', error);
    }
  }

  async markNoShow(
    citaId: number,
    negocioId: number,
  ): Promise<{ success: boolean; noShowCount: number; blocked: boolean }> {
    const cita = await this.noShowRepository.findCitaById(citaId);
    if (!cita) {
      return { success: false, noShowCount: 0, blocked: false };
    }

    // Mark as no-show
    await this.noShowRepository.markAsNoShow(citaId);

    // Increment client's no-show count
    const noShowCount = await this.noShowRepository.incrementNoShowCount(
      negocioId,
      cita.clienteTelefono,
    );

    // Auto-block if threshold reached
    let blocked = false;
    if (noShowCount >= BLOCK_THRESHOLD) {
      await this.noShowRepository.blockClient(negocioId, cita.clienteTelefono);
      blocked = true;
      const maskedPhone = cita.clienteTelefono.slice(-4).padStart(cita.clienteTelefono.length, '*');
      this.logger.warn(`Client ${maskedPhone} auto-blocked after ${noShowCount} no-shows`);

      // Notify business owner
      await this.notifyBusinessOfBlock(negocioId, cita.clienteTelefono, noShowCount);
    }

    return { success: true, noShowCount, blocked };
  }

  async getNoShowStats(negocioId: number): Promise<
    Array<{
      clienteNombre: string;
      clienteTelefono: string;
      noShowCount: number;
      blocked: boolean;
    }>
  > {
    return this.noShowRepository.getNoShowStats(negocioId);
  }

  async blockClient(negocioId: number, clienteTelefono: string): Promise<void> {
    await this.noShowRepository.blockClient(negocioId, clienteTelefono);
  }

  async unblockClient(negocioId: number, clienteTelefono: string): Promise<void> {
    await this.noShowRepository.unblockClient(negocioId, clienteTelefono);
  }

  async isClientBlocked(negocioId: number, clienteTelefono: string): Promise<boolean> {
    return this.noShowRepository.isClientBlocked(negocioId, clienteTelefono);
  }

  private async notifyBusinessOfBlock(
    negocioId: number,
    clienteTelefono: string,
    noShowCount: number,
  ): Promise<void> {
    try {
      const negocio = await this.negocioService.findByIdForInternal(negocioId);
      if (!negocio?.waAccessToken || !negocio.waPhoneNumberId) return;

      const maskedPhone = clienteTelefono.slice(-4).padStart(clienteTelefono.length, '*');
      const mensaje =
        `⚠️ *Alerta de No-Show*\n\n` +
        `El cliente con teléfono ${maskedPhone} ha acumulado ${noShowCount} inasistencias.\n\n` +
        `Ha sido bloqueado automáticamente del sistema de agendamiento.`;

      const negocioPhone = (negocio as any).telefonoOwner;
      if (!negocioPhone) {
        this.logger.log(`No hay telefonoOwner configurado para notificar al negocio ${negocioId}`);
        return;
      }

      await this.eventsService.sendWhatsAppMessage(
        { waAccessToken: negocio.waAccessToken, waPhoneNumberId: negocio.waPhoneNumberId },
        negocioPhone,
        mensaje,
      );
      this.logger.log(`Alerta de bloqueo enviada al dueño del negocio ${negocioId}`);
    } catch (error) {
      this.logger.error('Failed to send no-show alert', error);
    }
  }
}
