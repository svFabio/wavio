import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useCrearCitaMutation } from '../useCrearCitaMutation';
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
const payload = {
  clienteNombre: 'Ana',
  clienteTelefono: '9876543210',
  fecha: '2025-12-21',
  horario: '11:00',
};

describe('useCrearCitaMutation', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('mutation succeeds', async () => {
    server.use(
      http.post(`${BASE}/citas/admin`, () =>
        HttpResponse.json({ id: 'new-cita' }, { status: 201 }),
      ),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCrearCitaMutation(), { wrapper });
    const response = await result.current.mutateAsync(payload);
    expect(response).toEqual({ success: true });
  });

  it('mutation fails on API error', async () => {
    server.use(
      http.post(`${BASE}/citas/admin`, () =>
        HttpResponse.json({ error: 'Conflict' }, { status: 409 }),
      ),
    );
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCrearCitaMutation(), { wrapper });
    const response = await result.current.mutateAsync(payload);
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    queryClient.clear();
  });
});
