import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env';
import { createLogger } from '../logger';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = createLogger('RedisService');
  private readonly redis: Redis | null;

  constructor() {
    if (!env.REDIS_URL) {
      this.logger.warn('REDIS_URL not set — running without Redis (in-memory fallback)');
      this.redis = null;
      return;
    }

    try {
      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        this.logger.warn({ err: err.message }, 'Redis connection error');
      });

      this.redis.on('ready', () => {
        this.logger.info('Redis connected and ready');
      });

      this.redis.connect().catch((err) => {
        this.logger.warn(
          { err: err.message },
          'Redis initial connection failed — falling back to in-memory',
        );
      });
    } catch (err) {
      this.logger.warn(
        { err: err instanceof Error ? err.message : 'unknown' },
        'Failed to create Redis client — falling back to in-memory',
      );
      this.redis = null;
    }
  }

  onModuleDestroy(): void {
    if (this.redis) {
      this.redis.disconnect();
      this.logger.info('Redis client disconnected');
    }
  }

  get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable) return null;

    try {
      const raw = await this.redis!.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.debug({ key, err }, 'Redis GET failed, returning null');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis!.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.redis!.set(key, serialized);
      }
    } catch (err) {
      this.logger.debug({ key, err }, 'Redis SET failed, skipping cache write');
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isAvailable || keys.length === 0) return;

    try {
      await this.redis!.del(...keys);
    } catch (err) {
      this.logger.debug({ keys, err }, 'Redis DEL failed');
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.debug({ key, err }, 'Redis EXISTS failed, returning false');
      return false;
    }
  }

  getClient(): Redis | null {
    return this.redis;
  }
}
