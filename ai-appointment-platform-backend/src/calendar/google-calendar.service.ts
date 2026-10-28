import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { env } from '../config/env';
import { CalendarRepository } from './calendar.repository';
import type { Cita } from '../domain/types';
import { ExternalServiceError, NotFoundError } from '../domain/errors';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly calendarRepository: CalendarRepository) {}

  getAuthUrl(negocioId: number): string {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: String(negocioId),
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, negocioId: number): Promise<{ calendarId: string }> {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const calendarId = calendarList.data.items?.[0]?.id ?? 'primary';

    await this.calendarRepository.saveCalendarTokens(negocioId, {
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? '',
      calendarId,
    });

    this.logger.log(
      `Google Calendar connected for negocio ${negocioId}, calendarId: ${calendarId}`,
    );
    return { calendarId };
  }

  async createEvent(negocioId: number, cita: Cita): Promise<string | null> {
    const credentials = await this.getCredentials(negocioId);

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: credentials.googleCalendarAccessToken,
      refresh_token: credentials.googleCalendarRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { startDateTime, endDateTime } = this.computeEventTimes(cita);

    const event = await calendar.events.insert({
      calendarId: credentials.googleCalendarId!,
      requestBody: {
        summary: `${cita.servicio} — ${cita.clienteNombre ?? cita.clienteTelefono}`,
        description: [
          `Cita ID: ${cita.id}`,
          `Servicio: ${cita.servicio}`,
          `Cliente: ${cita.clienteNombre ?? cita.clienteTelefono}`,
          `Teléfono: ${cita.clienteTelefono}`,
        ].join('\n'),
        start: {
          dateTime: startDateTime,
          timeZone: credentials.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: credentials.timezone,
        },
      },
    });

    this.logger.log(`Created Google Calendar event for cita ${cita.id}: ${event.data.id}`);
    return event.data.id ?? null;
  }

  async updateEvent(negocioId: number, googleEventId: string, cita: Cita): Promise<boolean> {
    const credentials = await this.getCredentials(negocioId);

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: credentials.googleCalendarAccessToken,
      refresh_token: credentials.googleCalendarRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { startDateTime, endDateTime } = this.computeEventTimes(cita);

    await calendar.events.patch({
      calendarId: credentials.googleCalendarId!,
      eventId: googleEventId,
      requestBody: {
        summary: `${cita.servicio} — ${cita.clienteNombre ?? cita.clienteTelefono}`,
        description: [
          `Cita ID: ${cita.id}`,
          `Servicio: ${cita.servicio}`,
          `Cliente: ${cita.clienteNombre ?? cita.clienteTelefono}`,
          `Teléfono: ${cita.clienteTelefono}`,
        ].join('\n'),
        start: {
          dateTime: startDateTime,
          timeZone: credentials.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: credentials.timezone,
        },
      },
    });

    this.logger.log(`Updated Google Calendar event for cita ${cita.id}: ${googleEventId}`);
    return true;
  }

  async deleteEvent(negocioId: number, googleEventId: string): Promise<boolean> {
    const credentials = await this.getCredentials(negocioId);

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: credentials.googleCalendarAccessToken,
      refresh_token: credentials.googleCalendarRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: credentials.googleCalendarId!,
      eventId: googleEventId,
    });

    this.logger.log(`Deleted Google Calendar event: ${googleEventId}`);
    return true;
  }

  async disconnect(negocioId: number): Promise<void> {
    await this.calendarRepository.clearCalendarTokens(negocioId);
    this.logger.log(`Google Calendar disconnected for negocio ${negocioId}`);
  }

  async isConnected(negocioId: number): Promise<boolean> {
    return this.calendarRepository.isConnected(negocioId);
  }

  private computeEventTimes(cita: Cita): { startDateTime: string; endDateTime: string } {
    const fechaStr =
      cita.fecha instanceof Date
        ? cita.fecha.toISOString().split('T')[0]
        : String(cita.fecha).split('T')[0];

    const [hours, minutes] = cita.horario.split(':').map(Number);
    const duracion = cita.duracionMinutos || 60;
    const totalEndMinutes = hours * 60 + minutes + duracion;
    const endHours = String(Math.floor(totalEndMinutes / 60) % 24).padStart(2, '0');
    const endMins = String(totalEndMinutes % 60).padStart(2, '0');

    let endFechaStr = fechaStr;
    if (totalEndMinutes >= 24 * 60) {
      const nextDay = new Date(`${fechaStr}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + Math.floor(totalEndMinutes / (24 * 60)));
      endFechaStr = nextDay.toISOString().split('T')[0];
    }

    return {
      startDateTime: `${fechaStr}T${cita.horario}:00`,
      endDateTime: `${endFechaStr}T${endHours}:${endMins}:00`,
    };
  }

  private async getCredentials(negocioId: number): Promise<{
    googleCalendarAccessToken: string;
    googleCalendarRefreshToken: string;
    googleCalendarId: string;
    timezone: string;
  }> {
    const negocio = await this.calendarRepository.getCalendarCredentials(negocioId);

    if (!negocio) throw new NotFoundError('Negocio');
    if (!negocio.isGoogleCalendarConnected || !negocio.googleCalendarRefreshToken) {
      throw new ExternalServiceError(
        'Google Calendar is not connected for this business',
        'CALENDAR_NOT_CONNECTED',
        400,
      );
    }

    return {
      googleCalendarAccessToken: negocio.googleCalendarAccessToken ?? '',
      googleCalendarRefreshToken: negocio.googleCalendarRefreshToken,
      googleCalendarId: negocio.googleCalendarId ?? 'primary',
      timezone: negocio.timezone || 'America/La_Paz',
    };
  }
}
