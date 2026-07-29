import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useReprogramarCitaMutation } from '../useReprogramarCitaMutation';
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

describe('useReprogramarCitaMutation', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('successfully reschedules', async () => {
    server.use(http.put(`${BASE}/citas/:id/reprogramar`, () => HttpResponse.json({ ok: true })));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReprogramarCitaMutation(), { wrapper });
    const response = await result.current.mutateAsync({
      citaId: 'abc-123',
      fecha: '2025-12-22',
      horario: '15:00',
    });
    expect(response).toEqual({ success: true });
  });

  it('handles error on reschedule', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/reprogramar`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReprogramarCitaMutation(), { wrapper });
    const response = await result.current.mutateAsync({
      citaId: 'bad-id',
      fecha: '2025-12-22',
      horario: '15:00',
    });
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
