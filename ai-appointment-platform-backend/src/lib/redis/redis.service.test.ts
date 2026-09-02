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

// Mock the env module
vi.mock('../../config/env', () => ({
  env: { REDIS_URL: undefined, LOG_LEVEL: 'info' },
}));

describe('RedisService', () => {
  describe('when Redis is available', () => {
    let service: RedisService;

    beforeEach(() => {
      // Create service and inject mock redis directly
      service = new RedisService();
      // Override the internal redis with a mock
      Object.defineProperty(service, 'redis', {
        value: createMockRedis('ready'),
        writable: false,
      });
    });

    it('isAvailable returns true', () => {
      expect(service.isAvailable).toBe(true);
    });

    it('getClient returns the client', () => {
      expect(service.getClient()).toBeTruthy();
    });
  });

  describe('when no REDIS_URL is set', () => {
    it('isAvailable returns false', () => {
      const service = new RedisService();
      expect(service.isAvailable).toBe(false);
    });

    it('getClient returns null', () => {
      const service = new RedisService();
      expect(service.getClient()).toBeNull();
    });

    it('get returns null', async () => {
      const service = new RedisService();
      expect(await service.get('key')).toBeNull();
    });

    it('set does nothing', async () => {
      const service = new RedisService();
      await expect(service.set('key', 'value')).resolves.toBeUndefined();
    });

    it('del does nothing', async () => {
      const service = new RedisService();
      await expect(service.del('key')).resolves.toBeUndefined();
    });

    it('exists returns false', async () => {
      const service = new RedisService();
      expect(await service.exists('key')).toBe(false);
    });
  });
});
