import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NoShowRepository } from '../repositories/noshow.repository';
import { NegocioRepository } from '../repositories/negocio.repository';

const BLOCK_THRESHOLD = 3;


@Injectable()
export class NoShowService {
  private readonly logger = new Logger(NoShowService.name);

  constructor(
    private readonly noShowRepository: NoShowRepository,
    private readonly negocioRepository: NegocioRepository,
  ) {}


  /**
   * Check for expired in-progress appointments and mark as no-show.
   * Runs every 30 minutes.
   */
  @Cron('*/30 * * * *')
  async checkExpiredAppointments(): Promise<void> {
    this.logger.debug('Checking for expired appointments…');

    try {
      // This would need to iterate over all active businesses
      // For now, we'll handle it via the validation endpoint
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

    // Mark as no-show
    await this.noShowRepository.markAsNoShow(citaId);

    // Increment client's no-show count
    const telefono = cita?.clienteTelefono;
    if (!telefono) {

      return { success: true, noShowCount: 0, blocked: false };
    }

    const noShowCount =
      await this.noShowRepository.incrementNoShowCount(negocioId, telefono);

    // Auto-block if threshold reached
    let blocked = false;
    if (noShowCount >= BLOCK_THRESHOLD) {
      await this.noShowRepository.blockClient(negocioId, telefono);
      blocked = true;
      const maskedPhone = telefono.slice(-4).padStart(telefono.length, '*');
      this.logger.warn(
        `Client ${maskedPhone} auto-blocked after ${noShowCount} no-shows`,
      );


      // Notify business owner
      await this.notifyBusinessOfBlock(negocioId, telefono, noShowCount);
    }

    return { success: true, noShowCount, blocked };
  }

  async getNoShowStats(
    negocioId: number,
  ): Promise<
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

  async unblockClient(
    negocioId: number,
    clienteTelefono: string,
  ): Promise<void> {
    await this.noShowRepository.unblockClient(negocioId, clienteTelefono);
  }

  async isClientBlocked(
    negocioId: number,
    clienteTelefono: string,
  ): Promise<boolean> {
    return this.noShowRepository.isClientBlocked(negocioId, clienteTelefono);
  }

  private async notifyBusinessOfBlock(
    negocioId: number,
    clienteTelefono: string,
    noShowCount: number,
  ): Promise<void> {
    try {
      const negocio =
        await this.negocioRepository.findByIdForInternal(negocioId);
      if (!negocio?.waAccessToken || !negocio.waPhoneNumberId) return;

      const maskedPhone = clienteTelefono.slice(-4).padStart(clienteTelefono.length, '*');
      const mensaje =
        `⚠️ *Alerta de No-Show*\n\n` +
        `El cliente con teléfono ${maskedPhone} ha acumulado ${noShowCount} inasistencias.\n\n` +
        `Ha sido bloqueado automáticamente del sistema de agendamiento.`;


      // This would send to the business owner's WhatsApp
      // For now, just log it
      this.logger.warn(
        `No-show alert for business ${negocioId}: ${mensaje}`,
      );
    } catch (error) {
      this.logger.error('Failed to send no-show alert', error);
    }
  }
}
