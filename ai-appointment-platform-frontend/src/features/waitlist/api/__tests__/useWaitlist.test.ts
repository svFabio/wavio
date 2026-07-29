import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import {
  useWaitlistQuery,
  useAddToWaitlistMutation,
  useRemoveFromWaitlistMutation,
  useNotifyWaitlistMutation,
} from '../useWaitlist';

vi.mock('../../../../lib/api', () => ({
  api: {
    getWaitlist: vi.fn(),
    addToWaitlist: vi.fn(),
    removeFromWaitlist: vi.fn(),
    notifyWaitlist: vi.fn(),
  },
}));

import { api } from '../../../../lib/api';

describe('useWaitlistQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches waitlist entries', async () => {
    vi.mocked(api.getWaitlist).mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => useWaitlistQuery());
    expect(result.current.isLoading).toBe(true);
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});

describe('useAddToWaitlistMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls addToWaitlist and invalidates query', async () => {
    vi.mocked(api.addToWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useAddToWaitlistMutation());
    result.current.mutate({
      clienteNombre: 'Juan',
      clienteTelefono: '59170000000',
      fechaPreferida: '2026-02-01',
    });
    await vi.waitFor(() => {
      expect(api.addToWaitlist).toHaveBeenCalled();
    });
  });
});

describe('useRemoveFromWaitlistMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls removeFromWaitlist with id', async () => {
    vi.mocked(api.removeFromWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useRemoveFromWaitlistMutation());
    result.current.mutate(1);
    await vi.waitFor(() => {
      expect(api.removeFromWaitlist).toHaveBeenCalledWith(1);
    });
  });
});

describe('useNotifyWaitlistMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notifyWaitlist with id', async () => {
    vi.mocked(api.notifyWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useNotifyWaitlistMutation());
    result.current.mutate(1);
    await vi.waitFor(() => {
      expect(api.notifyWaitlist).toHaveBeenCalledWith(1);
    });
  });
});
