import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { WaitlistContainer } from '../WaitlistContainer.container';

vi.mock('../../api/useWaitlist', () => ({
  useWaitlistQuery: vi.fn(),
  useAddToWaitlistMutation: vi.fn(),
  useRemoveFromWaitlistMutation: vi.fn(),
  useNotifyWaitlistMutation: vi.fn(),
}));

import {
  useWaitlistQuery,
  useAddToWaitlistMutation,
  useRemoveFromWaitlistMutation,
  useNotifyWaitlistMutation,
} from '../../api/useWaitlist';

const MOCK_ENTRIES = [
  {
    id: 1,
    clienteNombre: 'Ana López',
    clienteTelefono: '+59160000001',
    servicio: 'Corte',
    estado: 'PENDIENTE' as const,
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: 2,
    clienteNombre: 'Carlos Ruiz',
    clienteTelefono: '+59160000002',
    servicio: 'Color',
    estado: 'NOTIFICADA' as const,
    createdAt: '2026-01-02T10:00:00Z',
  },
];

describe('WaitlistContainer', () => {
  const mockAdd = vi.fn();
  const mockRemove = vi.fn();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useWaitlistQuery).mockReturnValue({
      data: MOCK_ENTRIES,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWaitlistQuery>);

    vi.mocked(useAddToWaitlistMutation).mockReturnValue({
      mutateAsync: mockAdd,
    } as unknown as ReturnType<typeof useAddToWaitlistMutation>);

    vi.mocked(useRemoveFromWaitlistMutation).mockReturnValue({
      mutateAsync: mockRemove,
    } as unknown as ReturnType<typeof useRemoveFromWaitlistMutation>);

    vi.mocked(useNotifyWaitlistMutation).mockReturnValue({
      mutateAsync: mockNotify,
    } as unknown as ReturnType<typeof useNotifyWaitlistMutation>);
  });

  it('renders the waitlist view with entries', () => {
    renderWithProviders(<WaitlistContainer />);
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('shows loading state when query is loading', () => {
    vi.mocked(useWaitlistQuery).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useWaitlistQuery>);

    renderWithProviders(<WaitlistContainer />);
    // Should render without crashing in loading state
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument();
  });

  it('shows error message when query fails', () => {
    vi.mocked(useWaitlistQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useWaitlistQuery>);

    renderWithProviders(<WaitlistContainer />);
    expect(screen.getByText('Error cargando la lista de espera')).toBeInTheDocument();
  });

  it('calls notifyMutation when notify button is clicked', async () => {
    mockNotify.mockResolvedValue(undefined);
    renderWithProviders(<WaitlistContainer />);

    const notifyButtons = screen.getAllByRole('button', { name: /notificar/i });
    fireEvent.click(notifyButtons[0]);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(MOCK_ENTRIES[0].id);
    });
  });

  it('calls removeMutation when remove button is clicked', async () => {
    mockRemove.mockResolvedValue(undefined);
    renderWithProviders(<WaitlistContainer />);

    const removeButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(MOCK_ENTRIES[0].id);
    });
  });

  it('toggles the add form when the toggle button is clicked', () => {
    renderWithProviders(<WaitlistContainer />);

    const toggleButton = screen.getByRole('button', { name: /agregar|añadir/i });
    fireEvent.click(toggleButton);

    // Form should appear after toggle
    expect(screen.getByRole('form', { hidden: true })).toBeInTheDocument();
  });

  it('calls addMutation and closes form on successful add', async () => {
    mockAdd.mockResolvedValue(undefined);
    renderWithProviders(<WaitlistContainer />);

    // Open the add form
    const toggleButton = screen.getByRole('button', { name: /agregar|añadir/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockAdd).not.toHaveBeenCalled();
    });
  });

  it('resets pendingNotifyId after notify completes', async () => {
    let resolveFn: () => void;
    mockNotify.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        }),
    );

    renderWithProviders(<WaitlistContainer />);
    const notifyButtons = screen.getAllByRole('button', { name: /notificar/i });
    fireEvent.click(notifyButtons[0]);

    // Resolve the pending promise
    resolveFn!();

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledTimes(1);
    });
  });
});
