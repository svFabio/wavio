import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderService } from './reminder.service';
import type { AppointmentRepository } from '../repositories/appointment.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let mockAppointmentRepo: {
    findUpcomingForReminder: ReturnType<typeof vi.fn>;
    markReminderSent: ReturnType<typeof vi.fn>;
  };
  let mockNegocio: {
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
    findByIdForInternal: ReturnType<typeof vi.fn>;
  };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAppointmentRepo = {
      findUpcomingForReminder: vi.fn(),
      markReminderSent: vi.fn(),
    };
    mockNegocio = {
      getActiveBusinessIds: vi.fn(),
      findByIdForInternal: vi.fn(),
    };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    service = new ReminderService(
      mockAppointmentRepo as unknown as AppointmentRepository,
      mockNegocio as unknown as NegocioService,
      mockEvents as unknown as EventsService,
    );
  });

  describe('handleReminders24h', () => {
    it('should do nothing when no businesses', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([]);

      await service.handleReminders24h();

      expect(mockAppointmentRepo.findUpcomingForReminder).not.toHaveBeenCalled();
    });

    it('should skip already reminded citas', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          fecha: new Date(),
          horario: '10:00',
          servicio: 'Corte',
          recordatorio24h: true,
          recordatorio1h: false,
          negocioId: 1,
        },
      ]);

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should skip when negocio has no wa credentials', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          fecha: new Date(),
          horario: '10:00',
          servicio: 'Corte',
          recordatorio24h: false,
          recordatorio1h: false,
          negocioId: 1,
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: null,
        waPhoneNumberId: null,
      });

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should send 24h reminder and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          fecha: new Date(),
          horario: '10:00',
          servicio: 'Corte',
          recordatorio24h: false,
          recordatorio1h: false,
          negocioId: 1,
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '123',
      });

      await service.handleReminders24h();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markReminderSent).toHaveBeenCalledWith(1, '24h');
    });
  });

  describe('handleReminders1h', () => {
    it('should send 1h reminder and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        {
          id: 2,
          clienteNombre: 'María',
          clienteTelefono: '+529876543210',
          fecha: new Date(),
          horario: '11:00',
          servicio: 'Barba',
          recordatorio24h: true,
          recordatorio1h: false,
          negocioId: 1,
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '456',
      });

      await service.handleReminders1h();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markReminderSent).toHaveBeenCalledWith(2, '1h');
    });

    it('should skip already reminded 1h citas', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findUpcomingForReminder.mockResolvedValue([
        { id: 2, recordatorio1h: true },
      ]);

      await service.handleReminders1h();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });
  });
});
