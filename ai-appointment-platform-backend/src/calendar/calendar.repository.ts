import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Negocio } from '@prisma/client';

@Injectable()
export class CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendarCredentials(
    negocioId: number,
  ): Promise<
    Pick<
      Negocio,
      | 'googleCalendarAccessToken'
      | 'googleCalendarRefreshToken'
      | 'googleCalendarId'
      | 'isGoogleCalendarConnected'
    >
  > {
    return this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: {
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarId: true,
        isGoogleCalendarConnected: true,
      },
    });
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
