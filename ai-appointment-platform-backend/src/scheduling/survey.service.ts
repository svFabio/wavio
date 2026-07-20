import { Injectable, Logger } from '@nestjs/common';

// ============================================================
// ⚠️  DESACTIVADO POR DESARROLLO
// El sistema de encuestas post-cita está desactivado para evitar
// enviar mensajes a números reales durante pruebas.
// Para reactivar: implementar con Prisma + WhatsApp service
// y añadir @Cron('0 18 * * *') al método handleSurveys().
// ============================================================

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  /**
   * Daily post-appointment survey at 6 PM — currently disabled.
   * To activate: add @Cron('0 18 * * *') from @nestjs/schedule.
   */
  handleSurveys(): void {
    // TODO: Implement survey logic — query recently completed appointments
    //       and send satisfaction surveys to clients via WhatsApp.
    this.logger.warn('Survey service invoked but is disabled for development');
  }
}
