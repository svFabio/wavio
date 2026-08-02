import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoShowService } from './noshow.service';
import type { NoShowRepository } from './noshow.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';

describe('NoShowService', () => {
  let service: NoShowService;
  let mockRepo: {
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
    getExpiredInProgressAppointments: ReturnType<typeof vi.fn>;
    markAsNoShow: ReturnType<typeof vi.fn>;
    incrementNoShowCount: ReturnType<typeof vi.fn>;
    findCitaById: ReturnType<typeof vi.fn>;
    blockClient: ReturnType<typeof vi.fn>;
    unblockClient: ReturnType<typeof vi.fn>;
    isClientBlocked: ReturnType<typeof vi.fn>;
    getNoShowStats: ReturnType<typeof vi.fn>;
  };
  let mockNegocio: { findByIdForInternal: ReturnType<typeof vi.fn> };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRepo = {
      getActiveBusinessIds: vi.fn(),
      getExpiredInProgressAppointments: vi.fn(),
      markAsNoShow: vi.fn(),
      incrementNoShowCount: vi.fn(),
      findCitaById: vi.fn(),
      blockClient: vi.fn(),
      unblockClient: vi.fn(),
      isClientBlocked: vi.fn(),
      getNoShowStats: vi.fn(),
    };
    mockNegocio = { findByIdForInternal: vi.fn() };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    service = new NoShowService(
      mockRepo as unknown as NoShowRepository,
      mockNegocio as unknown as NegocioService,
      mockEvents as unknown as EventsService,
    );
  });

  describe('checkExpiredAppointments', () => {
    it('should do nothing when no active businesses', async () => {
      mockRepo.getActiveBusinessIds.mockResolvedValue([]);

      await service.checkExpiredAppointments();

      expect(mockRepo.getExpiredInProgressAppointments).not.toHaveBeenCalled();
    });

    it('should mark expired appointments as no-show', async () => {
      mockRepo.getActiveBusinessIds.mockResolvedValue([1]);
      mockRepo.getExpiredInProgressAppointments.mockResolvedValue([
        {
          id: 42,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          fecha: new Date(),
          horario: '10:00',
        },
      ]);
      mockRepo.incrementNoShowCount.mockResolvedValue(1);

      await service.checkExpiredAppointments();

      expect(mockRepo.markAsNoShow).toHaveBeenCalledWith(42);
      expect(mockRepo.incrementNoShowCount).toHaveBeenCalledWith(1, '+521234567890');
    });
  });

  describe('markNoShow', () => {
    it('should return failure when cita not found', async () => {
      mockRepo.findCitaById.mockResolvedValue(null);

      const result = await service.markNoShow(99, 1);

      expect(result).toEqual({ success: false, noShowCount: 0, blocked: false });
    });

    it('should mark no-show and increment count', async () => {
      mockRepo.findCitaById.mockResolvedValue({ clienteTelefono: '+521234567890' });
      mockRepo.incrementNoShowCount.mockResolvedValue(2);

      const result = await service.markNoShow(1, 1);

      expect(result).toEqual({ success: true, noShowCount: 2, blocked: false });
      expect(mockRepo.markAsNoShow).toHaveBeenCalledWith(1);
      expect(mockRepo.blockClient).not.toHaveBeenCalled();
    });

    it('should block client when threshold is reached', async () => {
      mockRepo.findCitaById.mockResolvedValue({ clienteTelefono: '+521234567890' });
      mockRepo.incrementNoShowCount.mockResolvedValue(3);

      const result = await service.markNoShow(1, 1);

      expect(result).toEqual({ success: true, noShowCount: 3, blocked: true });
      expect(mockRepo.blockClient).toHaveBeenCalledWith(1, '+521234567890');
    });
  });

  describe('getNoShowStats', () => {
    it('should return no-show stats', async () => {
      const stats = [
        { clienteNombre: 'Juan', clienteTelefono: '+521234567890', noShowCount: 2, blocked: false },
      ];
      mockRepo.getNoShowStats.mockResolvedValue(stats);

      const result = await service.getNoShowStats(1);

      expect(result).toEqual(stats);
    });
  });

  describe('blockClient', () => {
    it('should delegate to repository', async () => {
      await service.blockClient(1, '+521234567890');

      expect(mockRepo.blockClient).toHaveBeenCalledWith(1, '+521234567890');
    });
  });

  describe('unblockClient', () => {
    it('should delegate to repository', async () => {
      await service.unblockClient(1, '+521234567890');

      expect(mockRepo.unblockClient).toHaveBeenCalledWith(1, '+521234567890');
    });
  });

  describe('isClientBlocked', () => {
    it('should delegate to repository', async () => {
      mockRepo.isClientBlocked.mockResolvedValue(true);

      const result = await service.isClientBlocked(1, '+521234567890');

      expect(result).toBe(true);
    });
  });
});
