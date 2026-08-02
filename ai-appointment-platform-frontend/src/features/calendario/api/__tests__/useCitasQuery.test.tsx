import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../test-utils';
import { useCitasQuery } from '../useCitasQuery';
import type { Cita } from '../../../../types';
import type { ReactNode } from 'react';

const mockCita: Cita = {
  id: 'abc-123',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '1234567890',
  fecha: '2025-12-20',
  horario: '14:00',
  servicio: 'Corte',
  estado: 'CONFIRMADA',
  origen: 'virtual',
  creadoEn: '2025-12-01T00:00:00Z',
};

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

describe('useCitasQuery', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('returns data from MSW', async () => {
    server.use(
      http.get(`${BASE}/citas`, () => HttpResponse.json({ data: [mockCita], pagination: {} })),
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCitasQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockCita]);
  });

  it('returns data filtered by fecha', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/citas`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], pagination: {} });
      }),
    );
    const { wrapper } = createWrapper();
    renderHook(() => useCitasQuery('2025-12-20'), { wrapper });
    await waitFor(() => expect(capturedUrl).toContain('fecha=2025-12-20'));
  });

  it('starts in loading state', () => {
    server.use(http.get(`${BASE}/citas`, () => new Promise(() => {})));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCitasQuery(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
