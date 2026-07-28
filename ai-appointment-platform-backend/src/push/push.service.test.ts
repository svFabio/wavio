import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PushRepository } from './push.repository';

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
const mockSendNotification = webPush.sendNotification as ReturnType<typeof vi.fn>;
const mockSetVapidDetails = webPush.setVapidDetails as ReturnType<typeof vi.fn>;

describe('PushService', () => {
  let service: PushService;
  let mockRepo: {
    subscribe: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
    getByNegocioId: ReturnType<typeof vi.fn>;
    getByUserId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getByNegocioId: vi.fn(),
      getByUserId: vi.fn(),
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

  describe('isVapidConfigured', () => {
    it('should return true when configured', () => {
      expect(service.isVapidConfigured()).toBe(true);
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
    it('should send to all subscriptions for negocio', async () => {
      const subs = [{ endpoint: 'https://fcm.test/1', p256dh: 'key1', auth: 'auth1' }];
      mockRepo.getByNegocioId.mockResolvedValue(subs);
      mockSendNotification.mockResolvedValue({});

      const result = await service.sendNotification(1, { title: 'Test', body: 'Hello' });

      expect(result).toBe(1);
    });
  });

  describe('sendToUser', () => {
    it('should send to subscriptions for user', async () => {
      const subs = [{ endpoint: 'https://fcm.test/1', p256dh: 'key1', auth: 'auth1' }];
      mockRepo.getByUserId.mockResolvedValue(subs);
      mockSendNotification.mockResolvedValue({});

      const result = await service.sendToUser(1, { title: 'Test', body: 'Hello' });

      expect(result).toBe(1);
    });
  });

  describe('sendToSubscriptions', () => {
    it('should remove stale subscriptions on 410', async () => {
      const subs = [{ endpoint: 'https://fcm.test/stale', p256dh: 'key', auth: 'auth' }];
      mockRepo.getByNegocioId.mockResolvedValue(subs);
      const error = new Error('Gone');
      (error as Record<string, unknown>).statusCode = 410;
      mockSendNotification.mockRejectedValue(error);

      const result = await service.sendNotification(1, { title: 'Test', body: 'Hello' });

      expect(result).toBe(0);
      expect(mockRepo.unsubscribe).toHaveBeenCalledWith('https://fcm.test/stale');
    });

    it('should log other push errors without removing', async () => {
      const subs = [{ endpoint: 'https://fcm.test/err', p256dh: 'key', auth: 'auth' }];
      mockRepo.getByNegocioId.mockResolvedValue(subs);
      const error = new Error('Network error');
      (error as Record<string, unknown>).statusCode = 500;
      mockSendNotification.mockRejectedValue(error);

      const result = await service.sendNotification(1, { title: 'Test', body: 'Hello' });

      expect(result).toBe(0);
      expect(mockRepo.unsubscribe).not.toHaveBeenCalled();
    });
  });
});
