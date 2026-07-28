import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistService } from './waitlist.service';
import type { WaitlistRepository } from './waitlist.repository';
import type { EventsService } from '../events/events.service';
import type { NegocioService } from '../negocio/negocio.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let mockRepo: {
    addToWaitlist: ReturnType<typeof vi.fn>;
    getPendingForDate: ReturnType<typeof vi.fn>;
    markNotified: ReturnType<typeof vi.fn>;
    cancelEntry: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    getWaitlistCount: ReturnType<typeof vi.fn>;
  };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };
  let mockNegocio: { findByIdForInternal: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepo = {
      addToWaitlist: vi.fn(),
      getPendingForDate: vi.fn(),
      markNotified: vi.fn(),
      cancelEntry: vi.fn(),
      getAll: vi.fn(),
      getWaitlistCount: vi.fn(),
    };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    mockNegocio = { findByIdForInternal: vi.fn() };
    service = new WaitlistService(
      mockRepo as unknown as WaitlistRepository,
      mockEvents as unknown as EventsService,
      mockNegocio as unknown as NegocioService,
    );
  });

  describe('addToWaitlist', () => {
    it('should add entry and return confirmation message', async () => {
      mockRepo.addToWaitlist.mockResolvedValue({ id: 42 });

      const result = await service.addToWaitlist(1, {
        clienteNombre: 'Juan',
        clienteTelefono: '+521234567890',
        fechaPreferida: new Date('2026-08-01'),
      });

      expect(result).toEqual({ id: 42, message: expect.stringContaining('lista de espera') });
    });
  });

  describe('notifyAvailableSlot', () => {
    it('should return 0 when no pending entries', async () => {
      mockRepo.getPendingForDate.mockResolvedValue([]);

      const result = await service.notifyAvailableSlot(1, new Date('2026-08-01'));

      expect(result).toBe(0);
    });

    it('should return 0 when negocio has no wa credentials', async () => {
      mockRepo.getPendingForDate.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicioId: null,
          horarioPreferido: '14:00',
          creadoEn: new Date(),
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: null,
        waPhoneNumberId: null,
      });

      const result = await service.notifyAvailableSlot(1, new Date('2026-08-01'));

      expect(result).toBe(0);
    });

    it('should notify all pending entries', async () => {
      const entries = [
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicioId: null,
          horarioPreferido: '14:00',
          creadoEn: new Date(),
        },
        {
          id: 2,
          clienteNombre: 'María',
          clienteTelefono: '+529876543210',
          servicioId: null,
          horarioPreferido: null,
          creadoEn: new Date(),
        },
      ];
      mockRepo.getPendingForDate.mockResolvedValue(entries);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '123',
      });
      mockEvents.sendWhatsAppMessage.mockResolvedValue({});

      const result = await service.notifyAvailableSlot(1, new Date('2026-08-01'));

      expect(result).toBe(2);
      expect(mockRepo.markNotified).toHaveBeenCalledTimes(2);
    });

    it('should handle partial notification failures', async () => {
      const entries = [
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicioId: null,
          horarioPreferido: null,
          creadoEn: new Date(),
        },
        {
          id: 2,
          clienteNombre: 'María',
          clienteTelefono: '+529876543210',
          servicioId: null,
          horarioPreferido: null,
          creadoEn: new Date(),
        },
      ];
      mockRepo.getPendingForDate.mockResolvedValue(entries);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '123',
      });
      mockEvents.sendWhatsAppMessage
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({});

      const result = await service.notifyAvailableSlot(1, new Date('2026-08-01'));

      expect(result).toBe(1);
      expect(mockRepo.markNotified).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should cancel the waitlist entry', async () => {
      await service.remove(1, 42);

      expect(mockRepo.cancelEntry).toHaveBeenCalledWith(42);
    });
  });

  describe('notifySpecificEntry', () => {
    it('should do nothing when entry not found', async () => {
      mockRepo.getAll.mockResolvedValue([]);

      await service.notifySpecificEntry(1, 99);

      expect(mockNegocio.findByIdForInternal).not.toHaveBeenCalled();
    });

    it('should do nothing when negocio has no wa credentials', async () => {
      mockRepo.getAll.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicioId: null,
          horarioPreferido: null,
          fechaPreferida: new Date('2026-08-01'),
          creadoEn: new Date(),
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: null,
        waPhoneNumberId: null,
      });

      await service.notifySpecificEntry(1, 1);

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should notify and mark the specific entry', async () => {
      mockRepo.getAll.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicioId: null,
          horarioPreferido: '14:00',
          fechaPreferida: new Date('2026-08-01'),
          creadoEn: new Date(),
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '123',
      });

      await service.notifySpecificEntry(1, 1);

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockRepo.markNotified).toHaveBeenCalledWith(1);
    });
  });

  describe('getAll', () => {
    it('should return all entries', async () => {
      const entries = [{ id: 1, clienteNombre: 'Juan' }];
      mockRepo.getAll.mockResolvedValue(entries);

      const result = await service.getAll(1);

      expect(result).toEqual(entries);
    });
  });

  describe('getWaitlistCount', () => {
    it('should return count', async () => {
      mockRepo.getWaitlistCount.mockResolvedValue(5);

      const result = await service.getWaitlistCount(1);

      expect(result).toBe(5);
    });
  });
});
