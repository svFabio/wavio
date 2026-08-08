import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { usePendientesQuery } from '../usePendientesQuery';
import { citasApi } from '../../../calendario/api/citas.api';

vi.mock('../../../calendario/api/citas.api', () => ({
  citasApi: {
    obtenerPendientes: vi.fn(),
  },
}));

describe('usePendientesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches pending citas', async () => {
    vi.mocked(citasApi.obtenerPendientes).mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => usePendientesQuery());
    expect(result.current.isLoading).toBe(true);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});
