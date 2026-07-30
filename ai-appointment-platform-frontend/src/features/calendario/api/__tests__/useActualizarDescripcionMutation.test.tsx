import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useActualizarDescripcionMutation } from '../useActualizarDescripcionMutation';
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

describe('useActualizarDescripcionMutation', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('updates description successfully', async () => {
    server.use(http.put(`${BASE}/citas/:id/descripcion`, () => HttpResponse.json({ ok: true })));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActualizarDescripcionMutation(), { wrapper });
    const response = await result.current.mutateAsync({
      citaId: 'abc-123',
      descripcion: 'Nota importante',
    });
    expect(response).toEqual({ success: true });
  });

  it('handles error on description update', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/descripcion`, () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActualizarDescripcionMutation(), { wrapper });
    const response = await result.current.mutateAsync({
      citaId: 'abc-123',
      descripcion: 'desc',
    });
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
