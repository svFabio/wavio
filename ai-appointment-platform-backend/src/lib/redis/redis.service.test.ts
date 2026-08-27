import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

function createMockRedis(status = 'ready'): Redis {
  return {
    status,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
  } as unknown as Redis;
}

describe('RedisService', () => {
  describe('when Redis is available', () => {
    let redis: Redis;
    let service: RedisService;

    beforeEach(() => {
      redis = createMockRedis('ready');
      service = new RedisService(redis);
    });

    it('isAvailable returns true', () => {
      expect(service.isAvailable).toBe(true);
    });

    it('getClient returns the client', () => {
      expect(service.getClient()).toBe(redis);
    });

    it('get returns parsed JSON on hit', async () => {
      vi.mocked(redis.get).mockResolvedValue('{"foo":"bar"}');
      const result = await service.get<{ foo: string }>('key');
      expect(result).toEqual({ foo: 'bar' });
      expect(redis.get).toHaveBeenCalledWith('key');
    });

    it('get returns null on miss', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      expect(await service.get('key')).toBeNull();
    });

    it('get returns null on parse error', async () => {
      vi.mocked(redis.get).mockResolvedValue('not-json');
      expect(await service.get('key')).toBeNull();
    });

    it('get returns null on Redis error', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('connection lost'));
      expect(await service.get('key')).toBeNull();
    });

    it('set stores serialized value with TTL', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK');
      await service.set('key', { a: 1 }, 60);
      expect(redis.set).toHaveBeenCalledWith('key', '{"a":1}', 'EX', 60);
    });

    it('set stores serialized value without TTL', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK');
      await service.set('key', 'value');
      expect(redis.set).toHaveBeenCalledWith('key', '"value"');
    });

    it('set does not call EX when TTL is 0', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK');
      await service.set('key', 'value', 0);
      expect(redis.set).toHaveBeenCalledWith('key', '"value"');
    });

    it('set does not throw on Redis error', async () => {
      vi.mocked(redis.set).mockRejectedValue(new Error('fail'));
      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });

    it('del calls redis.del with keys', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);
      await service.del('a', 'b');
      expect(redis.del).toHaveBeenCalledWith('a', 'b');
    });

    it('del does nothing when no keys', async () => {
      await service.del();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('del does not throw on Redis error', async () => {
      vi.mocked(redis.del).mockRejectedValue(new Error('fail'));
      await expect(service.del('key')).resolves.toBeUndefined();
    });

    it('exists returns true when key exists', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);
      expect(await service.exists('key')).toBe(true);
    });

    it('exists returns false when key does not exist', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0);
      expect(await service.exists('key')).toBe(false);
    });

    it('exists returns false on Redis error', async () => {
      vi.mocked(redis.exists).mockRejectedValue(new Error('fail'));
      expect(await service.exists('key')).toBe(false);
    });
  });

  describe('when Redis is unavailable (null)', () => {
    let service: RedisService;

    beforeEach(() => {
      service = new RedisService(null);
    });

    it('isAvailable returns false', () => {
      expect(service.isAvailable).toBe(false);
    });

    it('getClient returns null', () => {
      expect(service.getClient()).toBeNull();
    });

    it('get returns null', async () => {
      expect(await service.get('key')).toBeNull();
    });

    it('set does nothing', async () => {
      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });

    it('del does nothing', async () => {
      await expect(service.del('key')).resolves.toBeUndefined();
    });

    it('exists returns false', async () => {
      expect(await service.exists('key')).toBe(false);
    });
  });

  describe('when Redis is not ready (connecting)', () => {
    it('isAvailable returns false', () => {
      const redis = createMockRedis('connecting');
      const service = new RedisService(redis);
      expect(service.isAvailable).toBe(false);
    });
  });
});
