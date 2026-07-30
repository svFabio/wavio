import { describe, it, expect } from 'vitest';
import { subscribePushSchema } from './push.dto';

describe('push.dto', () => {
  describe('subscribePushSchema', () => {
    it('should accept valid subscription data', () => {
      const result = subscribePushSchema.parse({
        endpoint: 'https://fcm.googleapis.com/test',
        p256dh: 'base64key123',
        auth: 'base64auth456',
      });
      expect(result.endpoint).toBe('https://fcm.googleapis.com/test');
      expect(result.p256dh).toBe('base64key123');
      expect(result.auth).toBe('base64auth456');
    });

    it('should reject invalid endpoint URL', () => {
      const result = subscribePushSchema.safeParse({
        endpoint: 'not-a-url',
        p256dh: 'key',
        auth: 'auth',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty p256dh', () => {
      const result = subscribePushSchema.safeParse({
        endpoint: 'https://fcm.test',
        p256dh: '',
        auth: 'auth',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty auth', () => {
      const result = subscribePushSchema.safeParse({
        endpoint: 'https://fcm.test',
        p256dh: 'key',
        auth: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing endpoint', () => {
      const result = subscribePushSchema.safeParse({ p256dh: 'key', auth: 'auth' });
      expect(result.success).toBe(false);
    });
  });
});
