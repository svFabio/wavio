import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
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
    } catch {
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
    } catch {
      // Silently fail — callers fall back to non-cached path
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isAvailable || keys.length === 0) return;

    try {
      await this.redis!.del(...keys);
    } catch {
      // Silently fail
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  getClient(): Redis | null {
    return this.redis;
  }
}
