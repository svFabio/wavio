import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const EXPIRY_MINUTES = 30;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean up inactive chat sessions and cancel expired in-progress appointments.
   * Runs every 5 minutes — matches the Express node-cron schedule.
   */
  @Cron('*/5 * * * *')
  async handleCleanup(): Promise<void> {
    this.logger.debug('Running scheduled cleanup…');

    try {
      const limiteTiempo = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

      // Delete inactive chat sessions
      const { count: sessionCount } = await this.prisma.sesionChat.deleteMany({
        where: { ultimoMensaje: { lt: limiteTiempo } },
      });

      if (sessionCount > 0) {
        this.logger.log(`Deleted ${sessionCount} inactive chat sessions`);
      }

      // Cancel expired in-progress appointments (>30 min without advancing)
      const { count: citaCount } = await this.prisma.cita.updateMany({
        where: {
          estado: 'EN_PROCESO',
          creadoEn: { lt: limiteTiempo },
        },
        data: { estado: 'CANCELADA' },
      });

      if (citaCount > 0) {
        this.logger.log(`Cancelled ${citaCount} expired in-progress appointments`);
      }
    } catch (error) {
      this.logger.error('Cleanup cron failed', error);
    }
  }
}
