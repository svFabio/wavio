import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarController } from './calendar.controller';
import type { GoogleCalendarService } from './google-calendar.service';
import type { CitasService } from '../citas/citas.service';
import { NotFoundError, ValidationError } from '../domain/errors';
import { buildCita, resetIds } from '../__tests__/factories';
import type { Cita } from '../domain/types';

describe('CalendarController', () => {
  let controller: CalendarController;
  let mockGoogleCalendarService: Record<string, ReturnType<typeof vi.fn>>;
  let mockCitasService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    resetIds();

    mockGoogleCalendarService = {
      getAuthUrl: vi.fn(),
      handleCallback: vi.fn(),
      createEvent: vi.fn(),
      deleteEvent: vi.fn(),
      disconnect: vi.fn(),
      isConnected: vi.fn(),
    };

    mockCitasService = {
      getByIdAndNegocio: vi.fn(),
      setGoogleEventId: vi.fn(),
    };

    controller = new CalendarController(
      mockGoogleCalendarService as unknown as GoogleCalendarService,
      mockCitasService as unknown as CitasService,
    );
  });

  describe('getAuthUrl', () => {
    it('returns the auth URL for the authenticated business', () => {
      mockGoogleCalendarService.getAuthUrl.mockReturnValue('https://accounts.google.com/oauth');

      const result = controller.getAuthUrl(1);
      expect(result).toEqual({ url: 'https://accounts.google.com/oauth' });
      expect(mockGoogleCalendarService.getAuthUrl).toHaveBeenCalledWith(1);
    });
  });

  describe('handleCallback', () => {
    it('throws when code is missing', async () => {
      await expect(controller.handleCallback(1, '', '1')).rejects.toThrow(ValidationError);
    });

    it('throws when state is missing', async () => {
      await expect(controller.handleCallback(1, 'valid_code', '')).rejects.toThrow(ValidationError);
    });

    it('throws when state does not match authenticated business', async () => {
      await expect(controller.handleCallback(1, 'valid_code', '2')).rejects.toThrow(
        ValidationError,
      );
    });

    it('handles callback successfully when state matches', async () => {
      mockGoogleCalendarService.handleCallback.mockResolvedValue({ calendarId: 'primary' });

      const result = await controller.handleCallback(1, 'valid_code', '1');
      expect(result).toEqual({ success: true, calendarId: 'primary' });
      expect(mockGoogleCalendarService.handleCallback).toHaveBeenCalledWith('valid_code', 1);
    });
  });

  describe('syncCita', () => {
    it('throws NotFoundError when cita does not exist', async () => {
      mockCitasService.getByIdAndNegocio.mockResolvedValue(null);

      await expect(controller.syncCita(1, 999)).rejects.toThrow(NotFoundError);
    });

    it('creates event and saves googleEventId on cita', async () => {
      const cita = buildCita(1, { id: 10 }) as unknown as Cita;
      mockCitasService.getByIdAndNegocio.mockResolvedValue(cita);
      mockGoogleCalendarService.createEvent.mockResolvedValue('google_evt_123');

      const result = await controller.syncCita(1, 10);

      expect(result).toEqual({ success: true, googleEventId: 'google_evt_123' });
      expect(mockGoogleCalendarService.createEvent).toHaveBeenCalledWith(1, cita);
      expect(mockCitasService.setGoogleEventId).toHaveBeenCalledWith(10, 1, 'google_evt_123');
    });
  });

  describe('removeCitaFromCalendar', () => {
    it('throws NotFoundError when cita does not exist', async () => {
      mockCitasService.getByIdAndNegocio.mockResolvedValue(null);

      await expect(controller.removeCitaFromCalendar(1, 999)).rejects.toThrow(NotFoundError);
    });

    it('returns success: true without calling Google if cita has no googleEventId', async () => {
      const cita = buildCita(1, { id: 10, googleEventId: null }) as unknown as Cita;
      mockCitasService.getByIdAndNegocio.mockResolvedValue(cita);

      const result = await controller.removeCitaFromCalendar(1, 10);

      expect(result).toEqual({ success: true });
      expect(mockGoogleCalendarService.deleteEvent).not.toHaveBeenCalled();
    });

    it('deletes event using googleEventId and clears it from cita', async () => {
      const cita = buildCita(1, { id: 10, googleEventId: 'google_evt_123' }) as unknown as Cita;
      mockCitasService.getByIdAndNegocio.mockResolvedValue(cita);
      mockGoogleCalendarService.deleteEvent.mockResolvedValue(true);

      const result = await controller.removeCitaFromCalendar(1, 10);

      expect(result).toEqual({ success: true });
      expect(mockGoogleCalendarService.deleteEvent).toHaveBeenCalledWith(1, 'google_evt_123');
      expect(mockCitasService.setGoogleEventId).toHaveBeenCalledWith(10, 1, null);
    });
  });

  describe('disconnect', () => {
    it('disconnects calendar for the business', async () => {
      mockGoogleCalendarService.disconnect.mockResolvedValue(undefined);

      const result = await controller.disconnect(1);
      expect(result).toEqual({ success: true });
      expect(mockGoogleCalendarService.disconnect).toHaveBeenCalledWith(1);
    });
  });

  describe('getStatus', () => {
    it('returns connection status', async () => {
      mockGoogleCalendarService.isConnected.mockResolvedValue(true);

      const result = await controller.getStatus(1);
      expect(result).toEqual({ connected: true });
    });
  });
});
