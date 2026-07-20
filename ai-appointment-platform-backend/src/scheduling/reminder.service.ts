import { Injectable, Logger } from '@nestjs/common';

// ============================================================
// ⚠️  DESACTIVADO POR DESARROLLO
// El sistema de recordatorios está desactivado para evitar
// enviar mensajes a números reales durante pruebas.
// Para reactivar: implementar con Prisma + WhatsApp service
// y añadir @Cron('0 * * * *') al método handleReminders().
// ============================================================

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  /**
   * Hourly appointment reminder check — currently disabled.
   * To activate: add @Cron('0 * * * *') from @nestjs/schedule.
   */
  handleReminders(): void {
    // TODO: Implement reminder logic — query upcoming appointments
    //       and send WhatsApp reminders to clients.
    this.logger.warn('Reminder service invoked but is disabled for development');
  }
}
