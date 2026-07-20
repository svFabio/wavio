import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { env } from '../config/env';
import type { Cita } from '../domain/types';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendarClient: calendar_v3.Calendar;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CALENDAR_CLIENT_ID,
      env.GOOGLE_CALENDAR_CLIENT_SECRET,
      env.GOOGLE_CALENDAR_REDIRECT_URI,
    );

    this.calendarClient = google.calendar({ version: 'v3', auth: oauth2Client });
  }

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

  async handleCallback(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    calendarId: string;
  }> {
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

    return {
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? '',
      calendarId,
    };
  }

  async createEvent(
    accessToken: string,
    refreshToken: string,
    calendarId: string,
    cita: Cita,
  ): Promise<string | null> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CALENDAR_CLIENT_ID,
        env.GOOGLE_CALENDAR_CLIENT_SECRET,
        env.GOOGLE_CALENDAR_REDIRECT_URI,
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const [hours, minutes] = cita.horario.split(':').map(Number);
      const startDate = new Date(cita.fecha);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 60);

      const event = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `${cita.servicio} — ${cita.clienteNombre ?? cita.clienteTelefono}`,
          description: `Cita ID: ${cita.id}\nServicio: ${cita.servicio}\nCliente: ${cita.clienteNombre ?? cita.clienteTelefono}\nTeléfono: ${cita.clienteTelefono}`,
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
    } catch (error) {
      this.logger.error(`Failed to create Google Calendar event for cita ${cita.id}`, error);
      return null;
    }
  }

  async deleteEvent(
    accessToken: string,
    refreshToken: string,
    calendarId: string,
    googleEventId: string,
  ): Promise<boolean> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CALENDAR_CLIENT_ID,
        env.GOOGLE_CALENDAR_CLIENT_SECRET,
        env.GOOGLE_CALENDAR_REDIRECT_URI,
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      });

      this.logger.log(`Deleted Google Calendar event: ${googleEventId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete Google Calendar event: ${googleEventId}`, error);
      return false;
    }
  }
}
