import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test-utils';
import { CalendarioContainer } from '../CalendarioContainer.container';

vi.mock('../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: vi.fn(() => ({
    eventos: [],
    scrollToTime: new Date(2026, 0, 1, 8, 0, 0),
    eventStyleGetter: vi.fn(() => ({ style: {} })),
  })),
  calcularFechasRecurrentes: vi.fn(),
}));

vi.mock('../../hooks/useCalendarHandlers', () => ({
  useCalendarHandlers: vi.fn(() => ({
    handleSelectSlot: vi.fn(),
    handleSelectEvent: vi.fn(),
    handleNoAsistio: vi.fn(),
    handleNuevaCita: vi.fn(),
    handleCerrarDetalle: vi.fn(),
    handleReprogramarDesdeDetalle: vi.fn(),
    handleGuardarDescripcion: vi.fn().mockResolvedValue({ success: true }),
    handleCerrarNuevaCita: vi.fn(),
    handleCrearCita: vi.fn().mockResolvedValue({ success: true }),
    handleCerrarReprogramar: vi.fn(),
    handleReprogramarCita: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

vi.mock('../../api/useCitasQuery', () => ({
  useCitasQuery: vi.fn(),
}));

vi.mock('../../api/useActualizarDescripcionMutation', () => ({
  useActualizarDescripcionMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('../../api/useCrearCitaMutation', () => ({
  useCrearCitaMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('../../api/useReprogramarCitaMutation', () => ({
  useReprogramarCitaMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('../../api/useNoShow', () => ({
  useMarkNoShowMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useMarkAsistioMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock('../../components/CalendarioView', () => ({
  CalendarioView: vi.fn(() => <div data-testid="calendario-view">CalendarioView</div>),
}));

vi.mock('../../../../shared/components/skeletons/CalendarioSkeleton', () => ({
  CalendarioSkeleton: vi.fn(() => <div data-testid="calendario-skeleton">Loading...</div>),
}));

vi.mock('../ModalNuevaCita.container', () => ({
  ModalNuevaCitaContainer: vi.fn(() => <div data-testid="modal-nueva-cita-container" />),
}));

import { useCitasQuery } from '../../api/useCitasQuery';

const mockedUseCitasQuery = vi.mocked(useCitasQuery);

describe('CalendarioContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton when loading with no data', () => {
    mockedUseCitasQuery.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
    } as any);
    renderWithProviders(<CalendarioContainer />);
    expect(screen.getByTestId('calendario-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('calendario-view')).not.toBeInTheDocument();
  });

  it('renders CalendarioView when data is loaded', () => {
    mockedUseCitasQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    renderWithProviders(<CalendarioContainer />);
    expect(screen.getByTestId('calendario-view')).toBeInTheDocument();
    expect(screen.queryByTestId('calendario-skeleton')).not.toBeInTheDocument();
  });

  it('renders CalendarioView even when loading if data exists (prefetched)', () => {
    mockedUseCitasQuery.mockReturnValue({
      data: [{ id: '1', clienteNombre: 'Test' }],
      isLoading: true,
      isError: false,
      error: null,
    } as any);
    renderWithProviders(<CalendarioContainer />);
    expect(screen.getByTestId('calendario-view')).toBeInTheDocument();
  });

  it('renders ModalNuevaCitaContainer', () => {
    mockedUseCitasQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    renderWithProviders(<CalendarioContainer />);
    expect(screen.getByTestId('modal-nueva-cita-container')).toBeInTheDocument();
  });
});
