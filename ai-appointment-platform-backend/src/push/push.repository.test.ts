import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushRepository } from './push.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildPushSubscription } from '../__tests__/factories';

describe('PushRepository', () => {
  let prisma: MockPrisma;
  let repo: PushRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new PushRepository(prisma as never);
  });

  const subscription = { endpoint: 'https://fcm.test/abc', p256dh: 'key', auth: 'auth' };

  describe('subscribe', () => {
    it('should upsert push subscription', async () => {
      const existing = buildPushSubscription(1, { id: 1, endpoint: subscription.endpoint });
      prisma.pushSubscription.upsert.mockResolvedValue(existing);

      const result = await repo.subscribe(1, null, subscription);

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: subscription.endpoint },
        update: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          negocioId: 1,
          userId: null,
        },
        create: {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          negocioId: 1,
          userId: null,
        },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should subscribe with userId', async () => {
      const sub = buildPushSubscription(1, { id: 2, endpoint: subscription.endpoint, userId: 5 });
      prisma.pushSubscription.upsert.mockResolvedValue(sub);

      const result = await repo.subscribe(1, 5, subscription);

      expect(result).toEqual({ id: 2 });
    });
  });

  describe('unsubscribe', () => {
    it('should delete subscription and return true', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      const result = await repo.unsubscribe(subscription.endpoint);

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: subscription.endpoint },
      });
      expect(result).toBe(true);
    });

    it('should return false when nothing deleted', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.unsubscribe('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getByNegocioId', () => {
    it('should return subscriptions for negocio', async () => {
      const subs = [
        { endpoint: 'url1', p256dh: 'k1', auth: 'a1' },
        { endpoint: 'url2', p256dh: 'k2', auth: 'a2' },
      ];
      prisma.pushSubscription.findMany.mockResolvedValue(subs);

      const result = await repo.getByNegocioId(1);

      expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        select: { endpoint: true, p256dh: true, auth: true },
      });
      expect(result).toEqual(subs);
    });

    it('should return empty array when no subscriptions', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([]);

      const result = await repo.getByNegocioId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getByUserId', () => {
    it('should return subscriptions for userId', async () => {
      const subs = [{ endpoint: 'url1', p256dh: 'k1', auth: 'a1' }];
      prisma.pushSubscription.findMany.mockResolvedValue(subs);

      const result = await repo.getByUserId(1);

      expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: { endpoint: true, p256dh: true, auth: true },
      });
      expect(result).toEqual(subs);
    });

    it('should return empty array when no subscriptions', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([]);

      const result = await repo.getByUserId(999);

      expect(result).toEqual([]);
    });
  });
});
