import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  const createContext = (usuario: unknown, headers: Record<string, string> = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ usuario, headers }),
      }),
    }) as never;

  it('should return false when no user', () => {
    const result = guard.canActivate(createContext(undefined));

    expect(result).toBe(false);
  });

  it('should throw BadRequestException when x-negocio-id header is missing', () => {
    const context = createContext({ id: 1, negocioId: 1, rol: 'ADMIN' });

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with correct message when header is missing', () => {
    const context = createContext({ id: 1, negocioId: 1, rol: 'ADMIN' });

    expect(() => guard.canActivate(context)).toThrow('x-negocio-id header is required');
  });

  it('should throw BadRequestException when x-negocio-id is not a number', () => {
    const context = createContext({ id: 1, negocioId: 1, rol: 'ADMIN' }, { 'x-negocio-id': 'abc' });

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with correct message when not a number', () => {
    const context = createContext({ id: 1, negocioId: 1, rol: 'ADMIN' }, { 'x-negocio-id': 'abc' });

    expect(() => guard.canActivate(context)).toThrow('x-negocio-id must be a number');
  });

  it('should throw ForbiddenException when negocioId does not match', () => {
    const context = createContext({ id: 1, negocioId: 5, rol: 'ADMIN' }, { 'x-negocio-id': '10' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with correct message when mismatched', () => {
    const context = createContext({ id: 1, negocioId: 5, rol: 'ADMIN' }, { 'x-negocio-id': '10' });

    expect(() => guard.canActivate(context)).toThrow('You do not have access to this business');
  });

  it('should return true when negocioId matches', () => {
    const req: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          ...req,
          usuario: { id: 1, negocioId: 3, rol: 'STAFF' },
          headers: { 'x-negocio-id': '3' },
        }),
      }),
    } as never;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should set request.negocioId when valid', () => {
    const req: Record<string, unknown> = {};
    const context = {
      switchToHttp: () => ({
        getRequest: () => {
          const r = req as Record<string, unknown>;
          r.usuario = { id: 1, negocioId: 2, rol: 'STAFF' };
          r.headers = { 'x-negocio-id': '2' };
          return r as never;
        },
      }),
    } as never;

    guard.canActivate(context);

    expect(req.negocioId).toBe(2);
  });
});
