import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { createLogger } from '../logger';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  private readonly logger = createLogger('RedisService');

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

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
