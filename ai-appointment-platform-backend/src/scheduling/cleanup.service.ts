import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CleanupRepository } from '../repositories/cleanup.repository';

const EXPIRY_MINUTES = 30;

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly cleanupRepository: CleanupRepository) {}

  /**
   * Clean up inactive chat sessions and cancel expired in-progress appointments.
   * Runs every 5 minutes — matches the Express node-cron schedule.
   */
  @Cron('*/5 * * * *')
  async handleCleanup(): Promise<void> {
    this.logger.debug('Running scheduled cleanup…');

    try {
      const limiteTiempo = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

      const sessionCount =
        await this.cleanupRepository.deleteInactiveSessions(limiteTiempo);
      if (sessionCount > 0) {
        this.logger.log(`Deleted ${sessionCount} inactive chat sessions`);
      }

      const citaCount =
        await this.cleanupRepository.cancelExpiredInProgressAppointments(
          limiteTiempo,
        );
      if (citaCount > 0) {
        this.logger.log(
          `Cancelled ${citaCount} expired in-progress appointments`,
        );
      }
    } catch (error) {
      this.logger.error('Cleanup cron failed', error);
    }
  }
}
