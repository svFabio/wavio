import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env';
import { RedisService } from './redis.service';
import { RedisThrottlerStorage } from './redis-throttler-storage';
import { createLogger } from '../logger';

const logger = createLogger('redis-module');

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        if (!env.REDIS_URL) {
          logger.warn('REDIS_URL not set — running without Redis (in-memory fallback)');
          return null;
        }

        try {
          const client = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
              if (times > 3) {
                logger.warn(
                  { attempts: times },
                  'Redis max retries reached, stopping reconnection',
                );
                return null;
              }
              const delay = Math.min(times * 200, 2000);
              return delay;
            },
            lazyConnect: true,
          });

          client.on('error', (err) => {
            logger.warn({ err: err.message }, 'Redis connection error');
          });

          client.on('connect', () => {
            logger.info('Redis connected');
          });

          client.on('ready', () => {
            logger.info('Redis ready');
          });

          client.connect().catch((err) => {
            logger.warn(
              { err: err.message },
              'Redis initial connection failed — falling back to in-memory',
            );
          });

          return client;
        } catch (err) {
          logger.warn(
            { err: err instanceof Error ? err.message : 'unknown' },
            'Failed to create Redis client — falling back to in-memory',
          );
          return null;
        }
      },
    },
    RedisService,
    RedisThrottlerStorage,
  ],
  exports: [REDIS_CLIENT, RedisService, RedisThrottlerStorage],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis | null) {}

  onModuleDestroy(): void {
    if (this.redisClient) {
      this.redisClient.disconnect();
      logger.info('Redis client disconnected');
    }
  }
}
