import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthRepository } from './health.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';

describe('HealthRepository', () => {
  let prisma: MockPrisma;
  let mockRedis: { isAvailable: boolean; getClient: ReturnType<typeof vi.fn> };
  let repo: HealthRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    mockRedis = {
      isAvailable: true,
      getClient: vi.fn().mockReturnValue({ status: 'ready' }),
    };
    repo = new HealthRepository(prisma as unknown as never, mockRedis as unknown as never);
  });

  describe('pingDatabase', () => {
    it('should execute a raw query when db is reachable', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      await expect(repo.pingDatabase()).resolves.toBeUndefined();
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should propagate the error when db fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));

      await expect(repo.pingDatabase()).rejects.toThrow('DB connection failed');
    });
  });

  describe('getRedisStatus', () => {
    it('should return ok when redis is available', () => {
      const result = repo.getRedisStatus();
      expect(result.available).toBe(true);
      expect(result.connected).toBe(true);
    });

    it('should return unavailable when redis is not available', () => {
      mockRedis.isAvailable = false;
      mockRedis.getClient.mockReturnValue(null);
      const result = repo.getRedisStatus();
      expect(result.available).toBe(false);
      expect(result.connected).toBe(false);
    });
  });
});
