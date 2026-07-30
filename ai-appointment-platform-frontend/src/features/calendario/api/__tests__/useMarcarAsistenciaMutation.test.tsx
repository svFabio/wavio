import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useMarcarAsistenciaMutation } from '../useMarcarAsistenciaMutation';
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

describe('useMarcarAsistenciaMutation', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('marks as not attended when noAsistio is true', async () => {
    server.use(http.put(`${BASE}/citas/:id/no-asistio`, () => HttpResponse.json({ ok: true })));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMarcarAsistenciaMutation(), { wrapper });
    const response = await result.current.mutateAsync({ citaId: 'abc-123', noAsistio: true });
    expect(response).toEqual({ success: true });
  });

  it('marks as attended when noAsistio is false', async () => {
    server.use(http.put(`${BASE}/citas/:id/asistio`, () => HttpResponse.json({ ok: true })));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMarcarAsistenciaMutation(), { wrapper });
    const response = await result.current.mutateAsync({ citaId: 'abc-123', noAsistio: false });
    expect(response).toEqual({ success: true });
  });

  it('handles error on mark attendance', async () => {
    server.use(
      http.put(`${BASE}/citas/:id/no-asistio`, () =>
        HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMarcarAsistenciaMutation(), { wrapper });
    const response = await result.current.mutateAsync({ citaId: 'abc-123', noAsistio: true });
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
