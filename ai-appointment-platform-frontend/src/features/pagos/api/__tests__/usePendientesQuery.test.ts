import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { usePendientesQuery } from '../usePendientesQuery';

vi.mock('../../../../lib/api', () => ({
  api: {
    obtenerPendientes: vi.fn(),
  },
}));

import { api } from '../../../../lib/api';

describe('usePendientesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches pending citas', async () => {
    vi.mocked(api.obtenerPendientes).mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => usePendientesQuery());
    expect(result.current.isLoading).toBe(true);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});
