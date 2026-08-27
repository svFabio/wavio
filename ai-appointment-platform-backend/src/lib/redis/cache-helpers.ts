import type { RedisService } from './redis.service';

/**
 * Try cache first. On miss, call fn and store the result.
 */
export async function cached<T>(
  redis: RedisService,
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get<T>(key);
  if (hit !== null) return hit;

  const value = await fn();
  await redis.set(key, value, ttlSeconds);
  return value;
}

/**
 * Invalidate keys matching exact keys or simple patterns.
 * For patterns, uses SCAN to find matching keys and deletes them in batches.
 */
export async function invalidate(redis: RedisService, ...keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const exactKeys: string[] = [];
  const patternKeys: string[] = [];

  for (const key of keys) {
    if (key.includes('*')) {
      patternKeys.push(key);
    } else {
      exactKeys.push(key);
    }
  }

  // Delete exact keys directly
  if (exactKeys.length > 0) {
    await redis.del(...exactKeys);
  }

  // For patterns, use SCAN via the raw client
  if (patternKeys.length > 0) {
    const client = redis.getClient();
    if (!client) return;

    for (const pattern of patternKeys) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        // Silently fail pattern invalidation
      }
    }
  }
}
