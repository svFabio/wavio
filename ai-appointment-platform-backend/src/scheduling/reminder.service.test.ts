import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReminderService } from './reminder.service';
import type { AppointmentRepository } from '../repositories/appointment.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';

const originalTz = process.env.TZ;

function cita({ id, horario }: { id: number; horario: string }, fechaISO: string) {
  return {
    id,
    clienteNombre: 'Juan',
    clienteTelefono: '+521234567890',
    fecha: new Date(fechaISO),
    horario,
    servicio: 'Corte',
    recordatorio24h: false,
    recordatorio1h: false,
    negocioId: 1,
  };
}

describe('ReminderService', () => {
  let service: ReminderService;
  let mockAppointmentRepo: {
    findUpcomingForReminder: ReturnType<typeof vi.fn>;
    markReminderSent: ReturnType<typeof vi.fn>;
  };
  let mockNegocio: {
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
    findByIdForInternal: ReturnType<typeof vi.fn>;
    findByIdsForInternal: ReturnType<typeof vi.fn>;
  };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
    mockAppointmentRepo = {
      findUpcomingForReminder: vi.fn(),
      markReminderSent: vi.fn(),
    };
    mockNegocio = {
      getActiveBusinessIds: vi.fn(),
      findByIdForInternal: vi.fn(),
      findByIdsForInternal: vi.fn(),
    };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    service = new ReminderService(
      mockAppointmentRepo as unknown as AppointmentRepository,
      mockNegocio as unknown as NegocioService,
      mockEvents as unknown as EventsService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  describe('handleReminders24h', () => {
    // Window: now (07-28 12:00Z) +23h..+25h => 07-29 11:00Z..13:00Z
    it('should do nothing when no businesses', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([]);

      await service.handleReminders24h();

      expect(mockAppointmentRepo.findUpcomingForReminder).not.toHaveBeenCalled();
    });

    it('should skip citas outside the reminder window', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      // horario 10:00 => 07-29 10:00Z, before window start (11:00Z)
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        cita({ id: 1, horario: '10:00' }, '2026-07-29'),
      ]);

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(mockAppointmentRepo.markReminderSent).not.toHaveBeenCalled();
    });

    it('should skip already reminded citas', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      const enVentana = cita({ id: 1, horario: '12:00' }, '2026-07-29');
      enVentana.recordatorio24h = true;
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([enVentana]);

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should skip when negocio has no wa credentials', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        cita({ id: 1, horario: '12:00' }, '2026-07-29'),
      ]);
      mockNegocio.findByIdsForInternal.mockResolvedValue(
        new Map([[1, { waAccessToken: null, waPhoneNumberId: null }]]),
      );

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should send 24h reminder and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        cita({ id: 1, horario: '12:00' }, '2026-07-29'),
      ]);
      mockNegocio.findByIdsForInternal.mockResolvedValue(
        new Map([[1, { waAccessToken: 'token', waPhoneNumberId: '123' }]]),
      );

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markReminderSent).toHaveBeenCalledWith(1, '24h');
    });
  });

  describe('handleReminders1h', () => {
    // Window: now +0.75h..+1.25h => 12:45Z..13:15Z
    it('should send 1h reminder and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        cita({ id: 2, horario: '13:00' }, '2026-07-28'),
      ]);
      mockNegocio.findByIdsForInternal.mockResolvedValue(
        new Map([[1, { waAccessToken: 'token', waPhoneNumberId: '456' }]]),
      );

      await service.handleReminders1h();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markReminderSent).toHaveBeenCalledWith(2, '1h');
    });

    it('should skip already reminded 1h citas', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      const enVentana = cita({ id: 2, horario: '13:00' }, '2026-07-28');
      enVentana.recordatorio1h = true;
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([enVentana]);

      await service.handleReminders1h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });
  });
});
