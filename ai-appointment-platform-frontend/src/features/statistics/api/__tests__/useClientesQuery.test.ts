import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { useClientesQuery } from '../useClientesQuery';
import { clientesApi } from '../clientes.api';

vi.mock('../clientes.api', () => ({
  clientesApi: {
    getClientes: vi.fn(),
  },
}));

describe('useClientesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches clientes with correct query key', async () => {
    vi.mocked(clientesApi.getClientes).mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => useClientesQuery());
    expect(result.current.isLoading).toBe(true);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});
