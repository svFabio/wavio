import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPushSupported,
  requestPushPermission,
  registerServiceWorker,
  sendSubscriptionToBackend,
} from '../push';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('push helper', () => {
  let originalNavigator: any;
  let originalWindow: any;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
    originalWindow = globalThis.window;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, writable: true });
    Object.defineProperty(globalThis, 'window', { value: originalWindow, writable: true });
  });

  it('isPushSupported returns true if supported', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: {} },
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', { value: { PushManager: {} }, writable: true });
    expect(isPushSupported()).toBe(true);
  });

  it('isPushSupported returns false if not supported', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, writable: true });
    expect(isPushSupported()).toBe(false);
  });

  it('requestPushPermission returns denied if Notification not in window', async () => {
    Object.defineProperty(globalThis, 'window', { value: {}, writable: true });
    const result = await requestPushPermission();
    expect(result).toBe('denied');
  });

  it('requestPushPermission returns existing permission', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { Notification: { permission: 'granted' } },
      writable: true,
    });
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted' },
      writable: true,
    });
    expect(await requestPushPermission()).toBe('granted');
  });

  it('registerServiceWorker calls navigator.serviceWorker.register', async () => {
    const mockRegister = vi.fn().mockResolvedValue('registered');
    Object.defineProperty(globalThis, 'navigator', {
      value: { serviceWorker: { register: mockRegister } },
      writable: true,
    });

    const result = await registerServiceWorker();
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    expect(result).toBe('registered');
  });

  it('sendSubscriptionToBackend sends correct payload', async () => {
    const mockSubscription = {
      endpoint: 'https://endpoint',
      toJSON: () => ({
        endpoint: 'https://endpoint',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      }),
    } as any as PushSubscription;

    await sendSubscriptionToBackend(mockSubscription);
    expect(apiClient.post).toHaveBeenCalledWith('/push/subscribe', {
      endpoint: 'https://endpoint',
      p256dh: 'p256dh-key',
      auth: 'auth-key',
    });
  });
});
