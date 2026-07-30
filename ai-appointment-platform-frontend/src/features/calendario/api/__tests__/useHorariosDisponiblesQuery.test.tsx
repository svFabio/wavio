import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useHorariosDisponiblesQuery } from '../useHorariosDisponiblesQuery';
import type { ReactNode } from 'react';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const BASE = '*/api/v1';

describe('useHorariosDisponiblesQuery', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('returns available slots when enabled', async () => {
    server.use(
      http.get(`${BASE}/citas/horarios-disponibles`, () =>
        HttpResponse.json({ horarios: ['09:00', '10:00', '11:00'] }),
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useHorariosDisponiblesQuery('2025-12-20', true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(['09:00', '10:00', '11:00']);
  });

  it('does not fetch when disabled', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useHorariosDisponiblesQuery('2025-12-20', false), {
      wrapper,
    });
    expect(result.current.isFetching).toBe(false);
  });

  it('returns empty array when horarios is missing', async () => {
    server.use(http.get(`${BASE}/citas/horarios-disponibles`, () => HttpResponse.json({})));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useHorariosDisponiblesQuery('2025-12-20', true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('includes servicioId param when provided', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/citas/horarios-disponibles`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ horarios: [] });
      }),
    );
    const { wrapper } = createWrapper();
    renderHook(() => useHorariosDisponiblesQuery('2025-12-20', true, 5), { wrapper });
    await waitFor(() => expect(capturedUrl).toContain('servicioId=5'));
  });
});
