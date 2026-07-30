import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 1, email: 'test@test.com', negocioId: 1, rol: 'ADMIN' };
      const context = { switchToHttp: () => ({ getRequest: () => ({}) }) };

      const result = guard.handleRequest(null, user, null, context as never);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user is false', () => {
      const context = { switchToHttp: () => ({ getRequest: () => ({}) }) };

      expect(() => guard.handleRequest(null, false, null, context as never)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with correct message', () => {
      const context = { switchToHttp: () => ({ getRequest: () => ({}) }) };

      expect(() => guard.handleRequest(null, false, null, context as never)).toThrow(
        'Token inválido o expirado',
      );
    });

    it('should re-throw the original error when present', () => {
      const err = new Error('Token expired');
      const context = { switchToHttp: () => ({ getRequest: () => ({}) }) };

      expect(() => guard.handleRequest(err, null, null, context as never)).toThrow(err);
    });

    it('should set request.usuario when valid', () => {
      const req: Record<string, unknown> = {};
      const user = { id: 1, email: 'test@test.com', negocioId: 1, rol: 'ADMIN' };
      const context = { switchToHttp: () => ({ getRequest: () => req }) };

      guard.handleRequest(null, user, null, context as never);

      expect(req.usuario).toEqual(user);
    });
  });
});
