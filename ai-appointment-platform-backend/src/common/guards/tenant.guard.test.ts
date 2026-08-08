import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  const negocios = [
    { negocioId: 1, rol: 'ADMIN' },
    { negocioId: 2, rol: 'STAFF' },
  ];

  const createContext = (usuario: unknown, headers: Record<string, string> = {}) => {
    const request: Record<string, unknown> = { usuario, headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    return { context, request };
  };

  it('should return false when no user', () => {
    const { context } = createContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should throw BadRequestException when x-negocio-id header is missing', () => {
    const { context } = createContext({ id: 1, email: 'test@test.com', negocios });

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with correct message when header is missing', () => {
    const { context } = createContext({ id: 1, email: 'test@test.com', negocios });

    expect(() => guard.canActivate(context)).toThrow('x-negocio-id header is required');
  });

  it('should throw BadRequestException when x-negocio-id is not a number', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': 'abc' },
    );

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException with correct message when not a number', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': 'abc' },
    );

    expect(() => guard.canActivate(context)).toThrow('x-negocio-id must be a number');
  });

  it('should throw ForbiddenException when negocio is not in memberships', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '10' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException with correct message when negocio not in memberships', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '10' },
    );

    expect(() => guard.canActivate(context)).toThrow('You do not have access to this business');
  });

  it('should return true when accessing first membership negocio', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '1' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true when accessing second membership negocio', () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '2' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should set request.negocioId when valid', () => {
    const { context, request } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '2' },
    );

    guard.canActivate(context);

    expect(request.negocioId).toBe(2);
  });

  it('should set request.usuario.rol to the active membership rol', () => {
    const { context, request } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '2' },
    );

    guard.canActivate(context);

    const usuario = request.usuario as Record<string, unknown>;
    expect(usuario.rol).toBe('STAFF');
  });

  it('should set request.usuario.negocioId to the active negocio', () => {
    const { context, request } = createContext(
      { id: 1, email: 'test@test.com', negocios },
      { 'x-negocio-id': '1' },
    );

    guard.canActivate(context);

    const usuario = request.usuario as Record<string, unknown>;
    expect(usuario.negocioId).toBe(1);
  });
});
