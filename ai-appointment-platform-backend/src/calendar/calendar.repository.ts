import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendarCredentials(negocioId: number): Promise<{
    googleCalendarAccessToken: string | null;
    googleCalendarRefreshToken: string | null;
    googleCalendarId: string | null;
    isGoogleCalendarConnected: boolean;
    timezone?: string | null;
  } | null> {
    const record = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: {
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarId: true,
        isGoogleCalendarConnected: true,
        configuracion: { select: { timezone: true } },
      },
    });

    if (!record) return null;

    return {
      googleCalendarAccessToken: record.googleCalendarAccessToken,
      googleCalendarRefreshToken: record.googleCalendarRefreshToken,
      googleCalendarId: record.googleCalendarId,
      isGoogleCalendarConnected: record.isGoogleCalendarConnected,
      timezone: record.configuracion?.timezone ?? null,
    };
  }

  async saveCalendarTokens(
    negocioId: number,
    data: { accessToken: string; refreshToken: string; calendarId: string },
  ): Promise<void> {
    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: {
        googleCalendarAccessToken: data.accessToken,
        googleCalendarRefreshToken: data.refreshToken,
        googleCalendarId: data.calendarId,
        isGoogleCalendarConnected: true,
      },
    });
  }

  async clearCalendarTokens(negocioId: number): Promise<void> {
    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: {
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarId: null,
        isGoogleCalendarConnected: false,
      },
    });
  }

  async isConnected(negocioId: number): Promise<boolean> {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { isGoogleCalendarConnected: true },
    });
    return negocio?.isGoogleCalendarConnected ?? false;
  }
}
