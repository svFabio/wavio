import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { EventsService } from '../events/events.service';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Send post-appointment surveys — runs daily at 6 PM.
   * Surveys completed appointments from the last 24 hours.
   */
  @Cron('0 18 * * *')
  async handleSurveys(): Promise<void> {
    this.logger.debug('Checking for post-appointment surveys…');

    try {
      const citas = await this.appointmentRepository.findCompletedForSurvey(
        0,
        24,
      );

      for (const cita of citas) {
        if (cita.encuestaEnviada) continue;
        if (!cita.negocio.waAccessToken || !cita.negocio.waPhoneNumberId) continue;

        const nombre = cita.clienteNombre || 'Cliente';
        const mensaje =
          `Hola ${nombre}! 👋\n\n` +
          `Gracias por tu visita. 🙏\n\n` +
          `¿Cómo fue tu experiencia? Por favor, envíanos un número del 1 al 5:\n\n` +
          `⭐ 1 - Mala\n` +
          `⭐⭐ 2 - Regular\n` +
          `⭐⭐⭐ 3 - Buena\n` +
          `⭐⭐⭐⭐ 4 - Muy buena\n` +
          `⭐⭐⭐⭐⭐ 5 - Excelente\n\n` +
          `También puedes escribir un comentario.`;

        await this.eventsService.sendWhatsAppMessage(
          {
            waAccessToken: cita.negocio.waAccessToken,
            waPhoneNumberId: cita.negocio.waPhoneNumberId,
          },
          cita.clienteTelefono,
          mensaje,
        );

        await this.appointmentRepository.markSurveySent(cita.id);
        this.logger.log(`Sent survey for cita ${cita.id}`);
      }
    } catch (error) {
      this.logger.error('Survey cron failed', error);
    }
  }
}
