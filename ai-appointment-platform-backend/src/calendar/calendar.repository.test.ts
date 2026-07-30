import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarRepository } from './calendar.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildNegocio, resetIds } from '../__tests__/factories';

describe('CalendarRepository', () => {
  let repo: CalendarRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new CalendarRepository(prisma as unknown as never);
  });

  describe('getCalendarCredentials', () => {
    it('should return calendar credentials when negocio exists', async () => {
      const negocio = buildNegocio({
        id: 1,
        googleCalendarAccessToken: 'access_token',
        googleCalendarRefreshToken: 'refresh_token',
        googleCalendarId: 'calendar@google.com',
        isGoogleCalendarConnected: true,
      });
      prisma.negocio.findUnique.mockResolvedValue({
        googleCalendarAccessToken: negocio.googleCalendarAccessToken,
        googleCalendarRefreshToken: negocio.googleCalendarRefreshToken,
        googleCalendarId: negocio.googleCalendarId,
        isGoogleCalendarConnected: negocio.isGoogleCalendarConnected,
      });

      const result = await repo.getCalendarCredentials(1);

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          googleCalendarAccessToken: true,
          googleCalendarRefreshToken: true,
          googleCalendarId: true,
          isGoogleCalendarConnected: true,
        },
      });
      expect(result).not.toBeNull();
      expect(result!.googleCalendarAccessToken).toBe('access_token');
    });

    it('should return null when negocio not found', async () => {
      prisma.negocio.findUnique.mockResolvedValue(null);

      const result = await repo.getCalendarCredentials(999);

      expect(result).toBeNull();
    });
  });

  describe('saveCalendarTokens', () => {
    it('should update negocio with calendar tokens', async () => {
      prisma.negocio.update.mockResolvedValue(buildNegocio({ id: 1 }));

      await repo.saveCalendarTokens(1, {
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
        calendarId: 'new@google.com',
      });

      expect(prisma.negocio.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          googleCalendarAccessToken: 'new_access',
          googleCalendarRefreshToken: 'new_refresh',
          googleCalendarId: 'new@google.com',
          isGoogleCalendarConnected: true,
        },
      });
    });
  });

  describe('clearCalendarTokens', () => {
    it('should clear calendar tokens', async () => {
      prisma.negocio.update.mockResolvedValue(buildNegocio({ id: 1 }));

      await repo.clearCalendarTokens(1);

      expect(prisma.negocio.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          googleCalendarAccessToken: null,
          googleCalendarRefreshToken: null,
          googleCalendarId: null,
          isGoogleCalendarConnected: false,
        },
      });
    });
  });

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      prisma.negocio.findUnique.mockResolvedValue({ isGoogleCalendarConnected: true });

      const result = await repo.isConnected(1);

      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      prisma.negocio.findUnique.mockResolvedValue({ isGoogleCalendarConnected: false });

      const result = await repo.isConnected(1);

      expect(result).toBe(false);
    });

    it('should return false when negocio not found', async () => {
      prisma.negocio.findUnique.mockResolvedValue(null);

      const result = await repo.isConnected(999);

      expect(result).toBe(false);
    });
  });
});
