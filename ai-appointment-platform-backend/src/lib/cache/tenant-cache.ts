import type { RedisService } from '../redis/redis.service';

export const tenantMemberMemoryCache = new Map<string, { rol: string; expiresAt: number }>();

export const getTenantMemberCacheKey = (userId: number, negocioId: number): string =>
  `tenant:member:${userId}:${negocioId}`;

export const invalidateTenantMemberCache = async (
  userId: number,
  negocioId: number,
  redisService?: RedisService | null,
): Promise<void> => {
  const key = getTenantMemberCacheKey(userId, negocioId);
  tenantMemberMemoryCache.delete(key);
  if (redisService?.isAvailable) {
    try {
      await redisService.del(key);
    } catch {
      // Ignored
    }
  }
};
