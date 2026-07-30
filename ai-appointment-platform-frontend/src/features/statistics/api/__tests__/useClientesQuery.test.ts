import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { useClientesQuery } from '../useClientesQuery';

vi.mock('../../../../lib/api', () => ({
  api: {
    getClientes: vi.fn(),
  },
}));

import { api } from '../../../../lib/api';

describe('useClientesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches clientes with correct query key', async () => {
    vi.mocked(api.getClientes).mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => useClientesQuery());
    expect(result.current.isLoading).toBe(true);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});
