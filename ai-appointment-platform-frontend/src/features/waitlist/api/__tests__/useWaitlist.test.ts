import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import { waitlistApi } from '../waitlist.api';
import {
  useWaitlistQuery,
  useAddToWaitlistMutation,
  useRemoveFromWaitlistMutation,
  useNotifyWaitlistMutation,
} from '../useWaitlist';

vi.mock('../waitlist.api', () => ({
  waitlistApi: {
    getWaitlist: vi.fn(),
    addToWaitlist: vi.fn(),
    removeFromWaitlist: vi.fn(),
    notifyWaitlist: vi.fn(),
  },
}));

describe('useWaitlistQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches waitlist entries', async () => {
    vi.mocked(waitlistApi.getWaitlist).mockResolvedValue([]);
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
    vi.mocked(waitlistApi.addToWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useAddToWaitlistMutation());
    result.current.mutate({
      clienteNombre: 'Juan',
      clienteTelefono: '59170000000',
      fechaPreferida: '2026-02-01',
    });
    await vi.waitFor(() => {
      expect(waitlistApi.addToWaitlist).toHaveBeenCalled();
    });
  });
});

describe('useRemoveFromWaitlistMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls removeFromWaitlist with id', async () => {
    vi.mocked(waitlistApi.removeFromWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useRemoveFromWaitlistMutation());
    result.current.mutate(1);
    await vi.waitFor(() => {
      expect(waitlistApi.removeFromWaitlist).toHaveBeenCalledWith(1);
    });
  });
});

describe('useNotifyWaitlistMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notifyWaitlist with id', async () => {
    vi.mocked(waitlistApi.notifyWaitlist).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useNotifyWaitlistMutation());
    result.current.mutate(1);
    await vi.waitFor(() => {
      expect(waitlistApi.notifyWaitlist).toHaveBeenCalledWith(1);
    });
  });
});
