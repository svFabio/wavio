import { describe, it, expect, beforeEach } from 'vitest';
import { HealthRepository } from './health.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';

describe('HealthRepository', () => {
  let prisma: MockPrisma;
  let repo: HealthRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new HealthRepository(prisma as unknown as never);
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
});
