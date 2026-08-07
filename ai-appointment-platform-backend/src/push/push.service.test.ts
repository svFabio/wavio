import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PushRepository } from '../repositories/push.repository';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
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
});
