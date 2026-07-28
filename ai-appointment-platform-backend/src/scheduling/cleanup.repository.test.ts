import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CleanupRepository } from './cleanup.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';

describe('CleanupRepository', () => {
  let repo: CleanupRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new CleanupRepository(prisma as unknown as never);
  });

  describe('deleteInactiveSessions', () => {
    it('should delete sessions older than limitDate', async () => {
      const limit = new Date('2026-01-01');
      prisma.sesionChat.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repo.deleteInactiveSessions(limit);

      expect(prisma.sesionChat.deleteMany).toHaveBeenCalledWith({
        where: { ultimoMensaje: { lt: limit } },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when none to delete', async () => {
      prisma.sesionChat.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.deleteInactiveSessions(new Date('2026-01-01'));

      expect(result).toBe(0);
    });
  });

  describe('cancelExpiredInProgressAppointments', () => {
    it('should cancel expired EN_PROCESO citas', async () => {
      const limit = new Date('2026-01-01');
      prisma.cita.updateMany.mockResolvedValue({ count: 3 });

      const result = await repo.cancelExpiredInProgressAppointments(limit);

      expect(prisma.cita.updateMany).toHaveBeenCalledWith({
        where: { estado: 'EN_PROCESO', creadoEn: { lt: limit } },
        data: { estado: 'CANCELADA' },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when none expired', async () => {
      prisma.cita.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.cancelExpiredInProgressAppointments(new Date('2026-01-01'));

      expect(result).toBe(0);
    });
  });
});
