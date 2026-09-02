import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisThrottlerStorage } from './redis-throttler-storage';
import type { RedisService } from './redis.service';

function createMockRedisService(overrides?: Partial<RedisService>): RedisService {
  return {
    isAvailable: true,
    getClient: vi.fn().mockReturnValue({
      exists: vi.fn().mockResolvedValue(0),
      pttl: vi.fn().mockResolvedValue(50000),
      get: vi.fn().mockResolvedValue('0'),
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
      setex: vi.fn().mockResolvedValue('OK'),
    }),
    ...overrides,
  } as unknown as RedisService;
}

describe('RedisThrottlerStorage', () => {
  describe('when Redis is available', () => {
    let storage: RedisThrottlerStorage;
    let mockRedis: ReturnType<RedisService['getClient']>;

    beforeEach(() => {
      const service = createMockRedisService();
      mockRedis = service.getClient();
      storage = new RedisThrottlerStorage(service);
    });

    it('isAvailable returns true', () => {
      expect(storage.isAvailable).toBe(true);
    });

    it('increment returns pass-through when not blocked', async () => {
      vi.mocked(mockRedis!.incr).mockResolvedValue(1);
      vi.mocked(mockRedis!.pttl).mockResolvedValue(60000);

      const result = await storage.increment('user1', 60000, 100, 0, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
      expect(result.timeToBlockExpire).toBe(0);
      expect(mockRedis!.incr).toHaveBeenCalled();
    });

    it('increment sets expiry on first hit', async () => {
      vi.mocked(mockRedis!.incr).mockResolvedValue(1);

      await storage.increment('user1', 60000, 100, 0, 'default');

      expect(mockRedis!.pexpire).toHaveBeenCalledWith('throttle:user1:default', 60000);
    });

    it('increment does not set expiry on subsequent hits', async () => {
      vi.mocked(mockRedis!.incr).mockResolvedValue(5);

      await storage.increment('user1', 60000, 100, 0, 'default');

      expect(mockRedis!.pexpire).not.toHaveBeenCalled();
    });

    it('increment blocks when limit exceeded and blockDuration > 0', async () => {
      vi.mocked(mockRedis!.incr).mockResolvedValue(101);
      vi.mocked(mockRedis!.pttl).mockResolvedValue(30000);

      const result = await storage.increment('user1', 60000, 100, 30000, 'default');

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(101);
      expect(mockRedis!.setex).toHaveBeenCalledWith('throttle:block:user1:default', 30, '1');
    });

    it('increment returns blocked status when already blocked', async () => {
      vi.mocked(mockRedis!.exists).mockResolvedValue(1);
      vi.mocked(mockRedis!.pttl).mockResolvedValue(15000);
      vi.mocked(mockRedis!.get).mockResolvedValue('50');

      const result = await storage.increment('user1', 60000, 100, 30000, 'default');

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(50);
      expect(result.timeToBlockExpire).toBe(15);
    });

    it('increment returns pass-through on Redis error', async () => {
      vi.mocked(mockRedis!.incr).mockRejectedValue(new Error('connection lost'));

      const result = await storage.increment('user1', 60000, 100, 0, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
    });
  });

  describe('when Redis is unavailable', () => {
    let storage: RedisThrottlerStorage;

    beforeEach(() => {
      const service = createMockRedisService({ isAvailable: false });
      storage = new RedisThrottlerStorage(service);
    });

    it('isAvailable returns false', () => {
      expect(storage.isAvailable).toBe(false);
    });

    it('increment returns pass-through', async () => {
      const result = await storage.increment('user1', 60000, 100, 0, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
      expect(result.timeToBlockExpire).toBe(0);
    });
  });
});
