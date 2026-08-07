import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  const createContext = (usuario: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ usuario }) }),
      getHandler: vi.fn<() => unknown>().mockReturnValue({}),
      getClass: vi.fn<() => unknown>().mockReturnValue({}),
    }) as never;

  beforeEach(() => {
    mockReflector = { getAllAndOverride: vi.fn() };
    guard = new RolesGuard(mockReflector as never);
  });

  it('should allow access when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext({ rol: 'STAFF' }));

    expect(result).toBe(true);
  });

  it('should allow access when roles list is empty', () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);

    const result = guard.canActivate(createContext({ rol: 'STAFF' }));

    expect(result).toBe(true);
  });

  it('should allow access when user has matching role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ rol: 'ADMIN' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow OWNER access to routes requiring ADMIN', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ rol: 'OWNER' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny STAFF access to routes requiring ADMIN', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ rol: 'STAFF' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user role does not match', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ rol: 'STAFF' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user has no rol property', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ id: 1 });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should deny access when user is undefined', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should look up roles from handler and class', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createContext({ rol: 'ADMIN' });

    guard.canActivate(context);

    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Object),
      expect.any(Object),
    ]);
  });
});
