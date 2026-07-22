import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { env } from '../config/env';
import { CalendarRepository } from '../repositories/calendar.repository';
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

    const [hours, minutes] = cita.horario.split(':').map(Number);
    const startDate = new Date(cita.fecha);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (cita.duracionMinutos || 60));

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
          dateTime: startDate.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Mexico_City',
        },
      },
    });

    this.logger.log(`Created Google Calendar event for cita ${cita.id}: ${event.data.id}`);
    return event.data.id ?? null;
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

  private async getCredentials(negocioId: number): Promise<{
    googleCalendarAccessToken: string;
    googleCalendarRefreshToken: string;
    googleCalendarId: string;
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
    };
  }
}
