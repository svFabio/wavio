import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';

const { mockDigest, mockUpdate, mockCreateHmac, mockTimingSafeEqual } = vi.hoisted(() => {
  const mockDigest = vi.fn();
  const mockUpdate = vi.fn(() => ({ digest: mockDigest }));
  const mockCreateHmac = vi.fn(() => ({ update: mockUpdate }));
  const mockTimingSafeEqual = vi.fn();
  return { mockDigest, mockUpdate, mockCreateHmac, mockTimingSafeEqual };
});

vi.mock('crypto', () => ({
  default: {
    createHmac: mockCreateHmac,
    timingSafeEqual: mockTimingSafeEqual,
  },
  createHmac: mockCreateHmac,
  timingSafeEqual: mockTimingSafeEqual,
}));

import { WhatsappSignatureGuard } from './whatsapp-signature.guard';

describe('WhatsappSignatureGuard', () => {
  let guard: WhatsappSignatureGuard;

  const createMockContext = (
    overrides: Partial<{
      signature: string | undefined;
      rawBody: Buffer | undefined;
    }> = {},
  ): ExecutionContext => {
    const req: Record<string, unknown> = {
      headers: {
        'x-hub-signature-256': overrides.signature,
      },
      rawBody: overrides.rawBody,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when META_APP_SECRET is configured', () => {
    const mockConfig = { META_APP_SECRET: 'my-app-secret' };

    beforeEach(() => {
      guard = new WhatsappSignatureGuard(mockConfig as typeof import('../config/env').env);
    });

    it('should return true for a valid signature', () => {
      mockDigest.mockReturnValue('abc123def456');
      mockTimingSafeEqual.mockReturnValue(true);

      const result = guard.canActivate(
        createMockContext({
          signature: 'sha256=abc123def456',
          rawBody: Buffer.from('{"test": true}'),
        }),
      );

      expect(result).toBe(true);
      expect(mockCreateHmac).toHaveBeenCalledWith('sha256', 'my-app-secret');
      expect(mockUpdate).toHaveBeenCalledWith(Buffer.from('{"test": true}'));
      expect(mockDigest).toHaveBeenCalledWith('hex');
    });

    it('should return false when signature header is missing', () => {
      const result = guard.canActivate(createMockContext({ rawBody: Buffer.from('test') }));

      expect(result).toBe(false);
      expect(mockCreateHmac).not.toHaveBeenCalled();
    });

    it('should return false when rawBody is missing', () => {
      const result = guard.canActivate(createMockContext({ signature: 'sha256=abc123' }));

      expect(result).toBe(false);
      expect(mockCreateHmac).not.toHaveBeenCalled();
    });

    it('should return false when signature length does not match computed length', () => {
      mockDigest.mockReturnValue('short');

      const result = guard.canActivate(
        createMockContext({
          signature: 'sha256=abc123def456',
          rawBody: Buffer.from('test'),
        }),
      );

      expect(result).toBe(false);
      expect(mockTimingSafeEqual).not.toHaveBeenCalled();
    });

    it('should return false when timingSafeEqual returns false', () => {
      mockDigest.mockReturnValue('abc123def456');
      mockTimingSafeEqual.mockReturnValue(false);

      const result = guard.canActivate(
        createMockContext({
          signature: 'sha256=abc123def456',
          rawBody: Buffer.from('test'),
        }),
      );

      expect(result).toBe(false);
      expect(mockTimingSafeEqual).toHaveBeenCalled();
    });

    it('should strip sha256= prefix before comparing', () => {
      mockDigest.mockReturnValue('expected-hex-value');
      mockTimingSafeEqual.mockReturnValue(true);

      guard.canActivate(
        createMockContext({
          signature: 'sha256=expected-hex-value',
          rawBody: Buffer.from('data'),
        }),
      );

      const expectedBuffer = Buffer.from('expected-hex-value');
      const computedBuffer = Buffer.from('expected-hex-value');
      expect(mockTimingSafeEqual).toHaveBeenCalledWith(expectedBuffer, computedBuffer);
    });
  });

  describe('when META_APP_SECRET is not configured', () => {
    it('should return false when META_APP_SECRET is undefined', () => {
      const guardSinSecret = new WhatsappSignatureGuard({} as typeof import('../config/env').env);

      const result = guardSinSecret.canActivate(
        createMockContext({
          signature: 'sha256=abc',
          rawBody: Buffer.from('test'),
        }),
      );

      expect(result).toBe(false);
    });

    it('should return false when META_APP_SECRET is an empty string', () => {
      const guardSinSecret = new WhatsappSignatureGuard({
        META_APP_SECRET: '',
      } as typeof import('../config/env').env);

      const result = guardSinSecret.canActivate(
        createMockContext({
          signature: 'sha256=abc',
          rawBody: Buffer.from('test'),
        }),
      );

      expect(result).toBe(false);
    });
  });
});
