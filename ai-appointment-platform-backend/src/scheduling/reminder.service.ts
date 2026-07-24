import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentRepository } from './appointment.repository';
import { NegocioService } from '../negocio/negocio.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly negocioService: NegocioService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Send 24-hour appointment reminders — runs every hour.
   */
  @Cron('0 * * * *')
  async handleReminders24h(): Promise<void> {
    this.logger.debug('Checking for 24h appointment reminders…');

    try {
      const negocios = await this.negocioService.getActiveBusinessIds();
      for (const negocioId of negocios) {
        const citas = await this.appointmentRepository.findUpcomingForReminder(negocioId, 23, 25);

        for (const cita of citas) {
          if (cita.recordatorio24h) continue;

          const waCreds = await this.negocioService.findByIdForInternal(cita.negocioId);
          if (!waCreds?.waAccessToken || !waCreds.waPhoneNumberId) continue;

          const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          });

          const mensaje =
            `Hola ${cita.clienteNombre || 'Cliente'}! 👋\n\n` +
            `📅 *Recordatorio:* Tu cita es mañana.\n\n` +
            `📋 *Detalles:*\n` +
            `📅 Fecha: ${fechaFormateada}\n` +
            `⏰ Hora: ${cita.horario}\n` +
            `💆‍♀️ Servicio: ${cita.servicio}\n\n` +
            `¡Te esperamos! Si necesitas reagendar, escríbenos.`;

          await this.eventsService.sendWhatsAppMessage(
            { waAccessToken: waCreds.waAccessToken, waPhoneNumberId: waCreds.waPhoneNumberId },
            cita.clienteTelefono,
            mensaje,
          );

          await this.appointmentRepository.markReminderSent(cita.id, '24h');
          this.logger.log(`Sent 24h reminder for cita ${cita.id}`);
        }
      }
    } catch (error) {
      this.logger.error('24h reminder cron failed', error);
    }
  }

  /**
   * Send 1-hour appointment reminders — runs every 15 minutes.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders1h(): Promise<void> {
    this.logger.debug('Checking for 1h appointment reminders…');

    try {
      const negocios = await this.negocioService.getActiveBusinessIds();
      for (const negocioId of negocios) {
        const citas = await this.appointmentRepository.findUpcomingForReminder(
          negocioId,
          0.75,
          1.25,
        );

        for (const cita of citas) {
          if (cita.recordatorio1h) continue;

          const waCreds = await this.negocioService.findByIdForInternal(cita.negocioId);
          if (!waCreds?.waAccessToken || !waCreds.waPhoneNumberId) continue;

          const mensaje =
            `Hola ${cita.clienteNombre || 'Cliente'}! 👋\n\n` +
            `⏰ *Recordatorio:* Tu cita es en 1 hora.\n\n` +
            `📋 *Detalles:*\n` +
            `⏰ Hora: ${cita.horario}\n` +
            `💆‍♀️ Servicio: ${cita.servicio}\n\n` +
            `¡Te esperamos!`;

          await this.eventsService.sendWhatsAppMessage(
            { waAccessToken: waCreds.waAccessToken, waPhoneNumberId: waCreds.waPhoneNumberId },
            cita.clienteTelefono,
            mensaje,
          );

          await this.appointmentRepository.markReminderSent(cita.id, '1h');
          this.logger.log(`Sent 1h reminder for cita ${cita.id}`);
        }
      }
    } catch (error) {
      this.logger.error('1h reminder cron failed', error);
    }
  }
}
