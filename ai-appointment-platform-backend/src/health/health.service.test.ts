import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './health.service';
import type { HealthRepository } from './health.repository';

describe('HealthService', () => {
  let mockRepo: {
    pingDatabase: ReturnType<typeof vi.fn>;
    getRedisStatus: ReturnType<typeof vi.fn>;
  };
  let service: HealthService;

  beforeEach(() => {
    mockRepo = {
      pingDatabase: vi.fn(),
      getRedisStatus: vi.fn().mockReturnValue({ available: true, connected: true }),
    };
    service = new HealthService(mockRepo as unknown as HealthRepository);
  });

  describe('check', () => {
    it('should return ok status when db is reachable', async () => {
      vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1005);
      vi.spyOn(process, 'uptime').mockReturnValue(120);

      const result = await service.check();

      expect(mockRepo.pingDatabase).toHaveBeenCalled();
      expect(result.status).toBe('ok');
      expect(result.db.status).toBe('ok');
      expect(result.db.latencyMs).toBe(5);
      expect(result.redis.status).toBe('ok');
      expect(result.uptime).toBe(120);
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return degraded status when db fails', async () => {
      mockRepo.pingDatabase.mockRejectedValue(new Error('DB connection failed'));
      vi.spyOn(Date, 'now').mockReturnValueOnce(2000).mockReturnValueOnce(2010);
      vi.spyOn(process, 'uptime').mockReturnValue(300);

      const result = await service.check();

      expect(result.status).toBe('degraded');
      expect(result.db.status).toBe('error');
      expect(result.uptime).toBe(300);
    });

    it('should return unavailable redis when redis is not available', async () => {
      mockRepo.getRedisStatus.mockReturnValue({ available: false, connected: false });
      vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1005);
      vi.spyOn(process, 'uptime').mockReturnValue(120);

      const result = await service.check();

      expect(result.redis.status).toBe('unavailable');
    });
  });
});
