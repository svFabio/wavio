import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { PortalContainer } from '../PortalContainer.container';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ token: 'valid-token' }) };
});

vi.mock('../../api/usePortal', () => ({
  useValidateMagicLinkQuery: vi.fn(),
  usePortalAppointmentsQuery: vi.fn(),
  usePortalServicesQuery: vi.fn(),
  usePortalAvailableSlotsQuery: vi.fn(),
  useBookAppointmentMutation: vi.fn(),
}));

import {
  useValidateMagicLinkQuery,
  usePortalAppointmentsQuery,
  usePortalServicesQuery,
  usePortalAvailableSlotsQuery,
  useBookAppointmentMutation,
} from '../../api/usePortal';

describe('PortalContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useValidateMagicLinkQuery).mockReturnValue({
      data: {
        cliente: { id: 1, nombre: 'Juan', telefono: '59170000000', email: null },
        negocio: { id: 1, nombre: 'Mi Spa' },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useValidateMagicLinkQuery>);
    vi.mocked(usePortalAppointmentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof usePortalAppointmentsQuery>);
    vi.mocked(usePortalServicesQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof usePortalServicesQuery>);
    vi.mocked(usePortalAvailableSlotsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof usePortalAvailableSlotsQuery>);
    vi.mocked(useBookAppointmentMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: null,
      error: null,
    } as unknown as ReturnType<typeof useBookAppointmentMutation>);
  });

  it('renders portal view', async () => {
    renderWithProviders(<PortalContainer />, { route: '/portal/valid-token' });
    expect(await screen.findByText('Mi Spa')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useValidateMagicLinkQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useValidateMagicLinkQuery>);
    renderWithProviders(<PortalContainer />, { route: '/portal/valid-token' });
    expect(screen.getByText('Validando enlace...')).toBeInTheDocument();
  });

  it('shows invalid link on error', () => {
    vi.mocked(useValidateMagicLinkQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Invalid'),
    } as unknown as ReturnType<typeof useValidateMagicLinkQuery>);
    renderWithProviders(<PortalContainer />, { route: '/portal/valid-token' });
    expect(screen.getByText('Enlace invalido')).toBeInTheDocument();
  });
});
