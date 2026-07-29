import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../../../test-utils';
import {
  useValidateMagicLinkQuery,
  usePortalAppointmentsQuery,
  usePortalServicesQuery,
  usePortalAvailableSlotsQuery,
  useBookAppointmentMutation,
  useGenerateLinkMutation,
} from '../usePortal';

vi.mock('../../../../lib/api', () => ({
  api: {
    validateMagicLink: vi.fn(),
    getPortalAppointments: vi.fn(),
    getPortalServices: vi.fn(),
    getPortalAvailableSlots: vi.fn(),
    bookPortalAppointment: vi.fn(),
    generateMagicLink: vi.fn(),
  },
}));

import { api } from '../../../../lib/api';

describe('useValidateMagicLinkQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled when token is empty', () => {
    vi.mocked(api.validateMagicLink).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useValidateMagicLinkQuery(''));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches validation when token is provided', async () => {
    vi.mocked(api.validateMagicLink).mockResolvedValue({
      cliente: { id: 1, nombre: 'Juan', telefono: '59170000000', email: null },
      negocio: { id: 1, nombre: 'Negocio' },
    } as never);
    const { result } = renderHookWithProviders(() => useValidateMagicLinkQuery('valid-token'));
    await vi.waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(api.validateMagicLink).toHaveBeenCalledWith('valid-token');
  });
});

describe('usePortalAppointmentsQuery', () => {
  it('is disabled when token is empty', () => {
    vi.mocked(api.getPortalAppointments).mockResolvedValue([] as never);
    const { result } = renderHookWithProviders(() => usePortalAppointmentsQuery(''));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePortalServicesQuery', () => {
  it('is disabled when token is empty', () => {
    vi.mocked(api.getPortalServices).mockResolvedValue([] as never);
    const { result } = renderHookWithProviders(() => usePortalServicesQuery(''));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePortalAvailableSlotsQuery', () => {
  it('is disabled when token or fecha is empty', () => {
    vi.mocked(api.getPortalAvailableSlots).mockResolvedValue([] as never);
    const { result } = renderHookWithProviders(() => usePortalAvailableSlotsQuery('', ''));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useBookAppointmentMutation', () => {
  it('calls bookPortalAppointment', async () => {
    vi.mocked(api.bookPortalAppointment).mockResolvedValue({} as never);
    const { result } = renderHookWithProviders(() => useBookAppointmentMutation('token'));
    result.current.mutate({ fecha: '2026-02-01', horario: '10:00' });
    await vi.waitFor(() => {
      expect(api.bookPortalAppointment).toHaveBeenCalledWith('token', {
        fecha: '2026-02-01',
        horario: '10:00',
      });
    });
  });
});

describe('useGenerateLinkMutation', () => {
  it('calls generateMagicLink', async () => {
    vi.mocked(api.generateMagicLink).mockResolvedValue({
      url: 'http://test.com/portal/abc',
      token: 'abc',
    } as never);
    const { result } = renderHookWithProviders(() => useGenerateLinkMutation());
    result.current.mutate(1);
    await vi.waitFor(() => {
      expect(api.generateMagicLink).toHaveBeenCalledWith(1);
    });
  });
});
