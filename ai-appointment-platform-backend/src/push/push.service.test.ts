import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PushRepository } from '../repositories/push.repository';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock('../config/env', () => ({
  env: {
    VAPID_PUBLIC_KEY: 'test-vapid-public',
    VAPID_PRIVATE_KEY: 'test-vapid-private',
    VAPID_EMAIL: 'test@example.com',
  },
}));

import webPush from 'web-push';
import { PushService } from './push.service';
const mockSetVapidDetails = webPush.setVapidDetails as ReturnType<typeof vi.fn>;

describe('PushService', () => {
  let service: PushService;
  let mockRepo: {
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
    findByNegocioId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      findByNegocioId: vi.fn(),
    };
    service = new PushService(mockRepo as unknown as PushRepository);
  });

  describe('constructor', () => {
    it('should configure VAPID when keys are present', () => {
      expect(mockSetVapidDetails).toHaveBeenCalledWith(
        'test@example.com',
        'test-vapid-public',
        'test-vapid-private',
      );
    });
  });

  describe('getVapidPublicKey', () => {
    it('should return public key when configured', () => {
      expect(service.getVapidPublicKey()).toBe('test-vapid-public');
    });
  });

  describe('subscribe', () => {
    it('should delegate to repository', async () => {
      mockRepo.subscribe.mockResolvedValue({ id: 1 });

      const result = await service.subscribe(1, null, {
        endpoint: 'https://fcm.test',
        p256dh: 'key',
        auth: 'auth',
      });

      expect(result).toEqual({ id: 1 });
    });
  });

  describe('unsubscribe', () => {
    it('should delegate to repository', async () => {
      mockRepo.unsubscribe.mockResolvedValue(true);

      const result = await service.unsubscribe('https://fcm.test');

      expect(result).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to all subscriptions of negocio', async () => {
      mockRepo.findByNegocioId.mockResolvedValue([
        { id: 1, endpoint: 'https://push1.com', p256dh: 'k1', auth: 'a1' },
        { id: 2, endpoint: 'https://push2.com', p256dh: 'k2', auth: 'a2' },
      ]);
      (webPush.sendNotification as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await service.sendNotification(1, { title: 'Test Title', body: 'Test Body', url: '/url' });

      expect(mockRepo.findByNegocioId).toHaveBeenCalledWith(1);
      expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
      expect(webPush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://push1.com', keys: { p256dh: 'k1', auth: 'a1' } },
        JSON.stringify({ title: 'Test Title', body: 'Test Body', url: '/url' }),
      );
    });

    it('should remove expired subscription when webPush returns 410 or 404', async () => {
      mockRepo.findByNegocioId.mockResolvedValue([
        { id: 1, endpoint: 'https://expired-push.com', p256dh: 'k1', auth: 'a1' },
      ]);
      const error410 = new Error('Gone') as Error & { statusCode: number };
      error410.statusCode = 410;
      (webPush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValue(error410);

      await service.sendNotification(1, { title: 'Expired', body: 'Test' });

      expect(mockRepo.unsubscribe).toHaveBeenCalledWith('https://expired-push.com');
    });

    it('should not remove subscription on general network errors', async () => {
      mockRepo.findByNegocioId.mockResolvedValue([
        { id: 1, endpoint: 'https://flaky-push.com', p256dh: 'k1', auth: 'a1' },
      ]);
      (webPush.sendNotification as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network timeout'),
      );

      await service.sendNotification(1, { title: 'Error', body: 'Test' });

      expect(mockRepo.unsubscribe).not.toHaveBeenCalled();
    });

    it('should return early when negocio has no subscriptions', async () => {
      mockRepo.findByNegocioId.mockResolvedValue([]);

      await service.sendNotification(1, { title: 'Empty', body: 'Test' });

      expect(webPush.sendNotification).not.toHaveBeenCalled();
    });
  });
});
