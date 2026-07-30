import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { useValidarPagoMutation } from '../useValidarPagoMutation';

vi.mock('../../../../lib/api', () => ({
  api: {
    validarPago: vi.fn(),
  },
}));

vi.mock('../../../../shared/hooks/useNotifications', () => ({
  useNotifications: () => ({
    showNotification: vi.fn(),
  }),
}));

import { api } from '../../../../lib/api';

describe('useValidarPagoMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls validarPago with correct params', async () => {
    vi.mocked(api.validarPago).mockResolvedValue(true);
    const { result } = renderHookWithProviders(() => useValidarPagoMutation());
    result.current.mutate({ id: 'abc-123', accion: 'APROBAR' });
    await vi.waitFor(() => {
      expect(api.validarPago).toHaveBeenCalledWith('abc-123', 'APROBAR');
    });
  });

  it('throws if validarPago returns false', async () => {
    vi.mocked(api.validarPago).mockResolvedValue(false);
    const { result } = renderHookWithProviders(() => useValidarPagoMutation());
    result.current.mutate({ id: 'abc-123', accion: 'APROBAR' });
    await vi.waitFor(() => {
      expect(api.validarPago).toHaveBeenCalled();
    });
  });
});
