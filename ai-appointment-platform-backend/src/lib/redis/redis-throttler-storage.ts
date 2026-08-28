import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';
import { createLogger } from '../logger';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const logger = createLogger('redis-throttler-storage');

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.isAvailable) {
      // Fallback: return a pass-through that doesn't actually block
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const storageKey = `throttle:${key}:${throttlerName}`;
    const blockKey = `throttle:block:${key}:${throttlerName}`;

    try {
      // Check if blocked
      const isBlocked = await this.redis!.exists(blockKey);
      if (isBlocked) {
        const blockTtl = await this.redis!.pttl(blockKey);
        const totalHits = Number(await this.redis!.get(storageKey)) || 0;
        return {
          totalHits,
          timeToExpire: Math.ceil((await this.redis!.pttl(storageKey)) / 1000),
          isBlocked: true,
          timeToBlockExpire: Math.ceil((blockTtl || 0) / 1000),
        };
      }

      // Increment counter
      const totalHits = await this.redis!.incr(storageKey);

      // Set expiration on first hit
      if (totalHits === 1) {
        await this.redis!.pexpire(storageKey, ttl);
      }

      const timeToExpire = await this.redis!.pttl(storageKey);

      // Check if limit exceeded
      if (totalHits > limit && blockDuration > 0) {
        await this.redis!.setex(blockKey, Math.ceil(blockDuration / 1000), '1');
        return {
          totalHits,
          timeToExpire: Math.ceil(timeToExpire / 1000),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockDuration / 1000),
        };
      }

      return {
        totalHits,
        timeToExpire: Math.ceil(timeToExpire / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : 'unknown' },
        'Redis throttler error — falling back',
      );
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
