import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleCalendarService } from './google-calendar.service';
import type { CalendarRepository } from './calendar.repository';
import { NotFoundError, ExternalServiceError } from '../domain/errors';
import { buildCita, resetIds } from '../__tests__/factories';
import type { Cita } from '../domain/types';

vi.hoisted(() => {
  process.env.LOG_LEVEL = 'fatal';
});

const mockOAuth2GenerateAuthUrl = vi.hoisted(() =>
  vi.fn(() => 'https://accounts.google.com/auth-url'),
);
const mockOAuth2GetToken = vi.hoisted(() => vi.fn());
const mockOAuth2SetCredentials = vi.hoisted(() => vi.fn());
const mockCalendarList = vi.hoisted(() => vi.fn());
const mockCalendarEventsInsert = vi.hoisted(() => vi.fn());
const mockCalendarEventsDelete = vi.hoisted(() => vi.fn());

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(function () {
        return {
          generateAuthUrl: mockOAuth2GenerateAuthUrl,
          getToken: mockOAuth2GetToken,
          setCredentials: mockOAuth2SetCredentials,
        };
      }),
    },
    calendar: vi.fn(function () {
      return {
        calendarList: { list: mockCalendarList },
        events: {
          insert: mockCalendarEventsInsert,
          delete: mockCalendarEventsDelete,
        },
      };
    }),
  },
}));

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let mockCalendarRepository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    resetIds();

    mockCalendarRepository = {
      getCalendarCredentials: vi.fn(),
      saveCalendarTokens: vi.fn(),
      clearCalendarTokens: vi.fn(),
      isConnected: vi.fn(),
    };

    service = new GoogleCalendarService(mockCalendarRepository as unknown as CalendarRepository);

    mockOAuth2GetToken.mockReset();
    mockOAuth2SetCredentials.mockReset();
    mockCalendarList.mockReset();
    mockCalendarEventsInsert.mockReset();
    mockCalendarEventsDelete.mockReset();
  });

  /* ─── getAuthUrl ────────────────────────────────────────────────── */

  describe('getAuthUrl', () => {
    it('should generate an OAuth URL with calendar scope', () => {
      const url = service.getAuthUrl(42);

      expect(url).toBe('https://accounts.google.com/auth-url');
      expect(mockOAuth2GenerateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/calendar.events'],
          state: '42',
          prompt: 'consent',
        }),
      );
    });
  });

  /* ─── handleCallback ────────────────────────────────────────────── */

  describe('handleCallback', () => {
    it('should exchange code, list calendars, and save tokens', async () => {
      mockOAuth2GetToken.mockResolvedValue({
        tokens: { access_token: 'at_new', refresh_token: 'rt_new' },
      });
      mockCalendarList.mockResolvedValue({
        data: { items: [{ id: 'business@group.calendar.google.com' }] },
      });

      const result = await service.handleCallback('auth-code', 1);

      expect(result.calendarId).toBe('business@group.calendar.google.com');
      expect(mockCalendarRepository.saveCalendarTokens).toHaveBeenCalledWith(1, {
        accessToken: 'at_new',
        refreshToken: 'rt_new',
        calendarId: 'business@group.calendar.google.com',
      });
    });

    it('should fallback to primary calendar when list returns no items', async () => {
      mockOAuth2GetToken.mockResolvedValue({
        tokens: { access_token: 'at', refresh_token: 'rt' },
      });
      mockCalendarList.mockResolvedValue({ data: { items: [] } });

      const result = await service.handleCallback('auth-code', 2);

      expect(result.calendarId).toBe('primary');
      expect(mockCalendarRepository.saveCalendarTokens).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ calendarId: 'primary' }),
      );
    });
  });

  /* ─── createEvent ───────────────────────────────────────────────── */

  describe('createEvent', () => {
    const mockCredentials = {
      googleCalendarAccessToken: 'at_123',
      googleCalendarRefreshToken: 'rt_123',
      googleCalendarId: 'business@google.com',
    };

    it('should create a calendar event and return the event ID', async () => {
      mockCalendarRepository.getCalendarCredentials.mockResolvedValue({
        ...mockCredentials,
        isGoogleCalendarConnected: true,
      });
      const cita = buildCita(1, {
        id: 99,
        fecha: new Date('2026-08-15'),
        horario: '14:30',
        servicio: 'Corte Premium',
        clienteNombre: 'María',
        clienteTelefono: '+521234567890',
        duracionMinutos: 90,
      }) as unknown as Cita;

      mockCalendarEventsInsert.mockResolvedValue({
        data: { id: 'google_event_001' },
      });

      const eventId = await service.createEvent(1, cita);

      expect(eventId).toBe('google_event_001');
      expect(mockCalendarEventsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          calendarId: 'business@google.com',
          requestBody: expect.objectContaining({
            summary: 'Corte Premium — María',
          }),
        }),
      );
    });

    it('should throw when negocio is not found', async () => {
      mockCalendarRepository.getCalendarCredentials.mockResolvedValue(null);

      const cita = buildCita(1) as unknown as Cita;
      await expect(service.createEvent(1, cita)).rejects.toThrow(NotFoundError);
    });

    it('should throw when calendar is not connected', async () => {
      mockCalendarRepository.getCalendarCredentials.mockResolvedValue({
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarId: null,
        isGoogleCalendarConnected: false,
      });

      const cita = buildCita(1) as unknown as Cita;
      await expect(service.createEvent(1, cita)).rejects.toThrow(ExternalServiceError);
    });
  });

  /* ─── deleteEvent ───────────────────────────────────────────────── */

  describe('deleteEvent', () => {
    it('should delete a calendar event and return true', async () => {
      mockCalendarRepository.getCalendarCredentials.mockResolvedValue({
        googleCalendarAccessToken: 'at',
        googleCalendarRefreshToken: 'rt',
        googleCalendarId: 'primary',
        isGoogleCalendarConnected: true,
      });
      mockCalendarEventsDelete.mockResolvedValue({ data: {} });

      const result = await service.deleteEvent(1, 'evt_999');

      expect(result).toBe(true);
      expect(mockCalendarEventsDelete).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'evt_999' }),
      );
    });
  });

  /* ─── disconnect ────────────────────────────────────────────────── */

  describe('disconnect', () => {
    it('should clear calendar tokens', async () => {
      await service.disconnect(1);

      expect(mockCalendarRepository.clearCalendarTokens).toHaveBeenCalledWith(1);
    });
  });

  /* ─── isConnected ───────────────────────────────────────────────── */

  describe('isConnected', () => {
    it('should return true when connected', async () => {
      mockCalendarRepository.isConnected.mockResolvedValue(true);

      const result = await service.isConnected(1);
      expect(result).toBe(true);
    });

    it('should return false when not connected', async () => {
      mockCalendarRepository.isConnected.mockResolvedValue(false);

      const result = await service.isConnected(1);
      expect(result).toBe(false);
    });
  });
});
