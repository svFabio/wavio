import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler-storage';

function createMockRedis(): Redis {
  return {
    status: 'ready',
    exists: vi.fn().mockResolvedValue(0),
    pttl: vi.fn().mockResolvedValue(50000),
    get: vi.fn().mockResolvedValue('0'),
    incr: vi.fn().mockResolvedValue(1),
    pexpire: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue('OK'),
  } as unknown as Redis;
}

describe('RedisThrottlerStorage', () => {
  describe('when Redis is available', () => {
    let redis: Redis;
    let storage: RedisThrottlerStorage;

    beforeEach(() => {
      redis = createMockRedis();
      storage = new RedisThrottlerStorage(redis);
    });

    it('isAvailable returns true', () => {
      expect(storage.isAvailable).toBe(true);
    });

    it('increment returns pass-through when not blocked', async () => {
      vi.mocked(redis.incr).mockResolvedValue(1);
      vi.mocked(redis.pttl).mockResolvedValue(60000);

      const result = await storage.increment('user1', 60000, 100, 0, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
      expect(result.timeToBlockExpire).toBe(0);
      expect(redis.incr).toHaveBeenCalled();
    });

    it('increment sets expiry on first hit', async () => {
      vi.mocked(redis.incr).mockResolvedValue(1);

      await storage.increment('user1', 60000, 100, 0, 'default');

      expect(redis.pexpire).toHaveBeenCalledWith('throttle:user1:default', 60000);
    });

    it('increment does not set expiry on subsequent hits', async () => {
      vi.mocked(redis.incr).mockResolvedValue(5);

      await storage.increment('user1', 60000, 100, 0, 'default');

      expect(redis.pexpire).not.toHaveBeenCalled();
    });

    it('increment blocks when limit exceeded and blockDuration > 0', async () => {
      vi.mocked(redis.incr).mockResolvedValue(101);
      vi.mocked(redis.pttl).mockResolvedValue(30000);

      const result = await storage.increment('user1', 60000, 100, 30000, 'default');

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(101);
      expect(redis.setex).toHaveBeenCalledWith('throttle:block:user1:default', 30, '1');
    });

    it('increment returns blocked status when already blocked', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);
      vi.mocked(redis.pttl).mockResolvedValue(15000);
      vi.mocked(redis.get).mockResolvedValue('50');

      const result = await storage.increment('user1', 60000, 100, 30000, 'default');

      expect(result.isBlocked).toBe(true);
      expect(result.totalHits).toBe(50);
      expect(result.timeToBlockExpire).toBe(15);
    });

    it('increment returns pass-through on Redis error', async () => {
      vi.mocked(redis.incr).mockRejectedValue(new Error('connection lost'));

      const result = await storage.increment('user1', 60000, 100, 0, 'default');

      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
    });
  });

  describe('when Redis is unavailable (null)', () => {
    let storage: RedisThrottlerStorage;

    beforeEach(() => {
      storage = new RedisThrottlerStorage(null);
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
