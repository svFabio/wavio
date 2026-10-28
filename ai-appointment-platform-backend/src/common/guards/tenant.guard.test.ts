import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import type { AuthService } from '../../auth/auth.service';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let mockAuthService: {
    verifyTenantMembership: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAuthService = {
      verifyTenantMembership: vi.fn(),
    };
    guard = new TenantGuard(mockAuthService as unknown as AuthService);
  });

  const createContext = (usuario: unknown, headers: Record<string, string> = {}) => {
    const request: Record<string, unknown> = { usuario, headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    return { context, request };
  };

  it('should return false when no user', async () => {
    const { context } = createContext(undefined);

    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('should throw BadRequestException when x-negocio-id header is missing', async () => {
    const { context } = createContext({ id: 1, email: 'test@test.com' });

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(context)).rejects.toThrow('x-negocio-id header is required');
  });

  it('should throw BadRequestException when x-negocio-id is not a number', async () => {
    const { context } = createContext(
      { id: 1, email: 'test@test.com' },
      { 'x-negocio-id': 'invalid' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(context)).rejects.toThrow('x-negocio-id must be a number');
  });

  it('should verify membership via AuthService and set tenant info on request', async () => {
    const { context, request } = createContext(
      { id: 1, email: 'test@test.com' },
      { 'x-negocio-id': '2' },
    );
    mockAuthService.verifyTenantMembership.mockResolvedValueOnce('ADMIN');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockAuthService.verifyTenantMembership).toHaveBeenCalledWith(1, 2);
    expect(request.negocioId).toBe(2);
    expect((request.usuario as Record<string, unknown>).rol).toBe('ADMIN');
    expect((request.usuario as Record<string, unknown>).negocioId).toBe(2);
  });

  it('should throw ForbiddenException when AuthService throws', async () => {
    const { context } = createContext(
      { id: 99, email: 'rogue@test.com' },
      { 'x-negocio-id': '10' },
    );
    mockAuthService.verifyTenantMembership.mockRejectedValue(
      new Error('No tienes acceso a este negocio'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('No tienes acceso a este negocio');
  });
});
