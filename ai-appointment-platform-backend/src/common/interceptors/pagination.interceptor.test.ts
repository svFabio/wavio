import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { PaginationInterceptor } from './pagination.interceptor';

describe('PaginationInterceptor', () => {
  let interceptor: PaginationInterceptor;

  beforeEach(() => {
    interceptor = new PaginationInterceptor();
  });

  const createContext = (query: Record<string, string> = {}) => {
    const req: Record<string, unknown> = { query };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
  };

  const createNext = (data: unknown) =>
    ({
      handle: () => of(data),
    }) as never;

  it('should use default page and limit when no query params', async () => {
    const context = createContext({});
    const next = createNext(['item1', 'item2']);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    expect(result).toEqual({
      data: ['item1', 'item2'],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('should use provided page and limit from query', async () => {
    const context = createContext({ page: '2', limit: '10' });
    const next = createNext([]);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    expect(result).toEqual({
      data: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('should clamp limit to max 100', async () => {
    const context = createContext({ page: '1', limit: '999' });
    const next = createNext([]);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    const pagination = (result as Record<string, unknown>).pagination as Record<string, unknown>;
    expect(pagination.limit).toBe(100);
  });

  it('should fallback to default limit when limit is 0', async () => {
    const context = createContext({ page: '1', limit: '0' });
    const next = createNext([]);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    const pagination = (result as Record<string, unknown>).pagination as Record<string, unknown>;
    expect(pagination.limit).toBe(20);
  });

  it('should clamp page to min 1', async () => {
    const context = createContext({ page: '-5', limit: '10' });
    const next = createNext([]);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    const pagination = (result as Record<string, unknown>).pagination as Record<string, unknown>;
    expect(pagination.page).toBe(1);
  });

  it('should use total from request._total when available', async () => {
    const req: Record<string, unknown> = { query: { page: '1', limit: '10' }, _total: 50 };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
    const next = createNext(['item1', 'item2']);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    expect(result).toEqual({
      data: ['item1', 'item2'],
      pagination: { page: 1, limit: 10, total: 50, totalPages: 5 },
    });
  });

  it('should calculate totalPages correctly', async () => {
    const req: Record<string, unknown> = { query: { page: '1', limit: '10' }, _total: 25 };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
    const next = createNext([]);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    const pagination = (result as Record<string, unknown>).pagination as Record<string, unknown>;
    expect(pagination.totalPages).toBe(3);
  });

  it('should pass through already paginated response', async () => {
    const paginatedResponse = {
      data: [{ id: 1 }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    const context = createContext({});
    const next = createNext(paginatedResponse);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    expect(result).toBe(paginatedResponse);
  });

  it('should set request.pagination for downstream use', async () => {
    const req: Record<string, unknown> = { query: { page: '3', limit: '15' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
    const next = { handle: () => of([]) };

    await new Promise<void>((resolve) => {
      interceptor.intercept(context, next as never).subscribe(() => {
        expect(req.pagination).toEqual({ page: 3, limit: 15, skip: 30 });
        resolve();
      });
    });
  });

  it('should return empty array when response is null', async () => {
    const context = createContext({});
    const next = createNext(null);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    expect(result).toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('should handle non-numeric query params gracefully', async () => {
    const context = createContext({ page: 'abc', limit: 'xyz' });
    const next = createNext(['item']);

    const result = await new Promise<unknown>((resolve, nextFn) => {
      interceptor.intercept(context, next as never).subscribe(resolve, nextFn);
    });

    const pagination = (result as Record<string, unknown>).pagination as Record<string, unknown>;
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(20);
  });
});
