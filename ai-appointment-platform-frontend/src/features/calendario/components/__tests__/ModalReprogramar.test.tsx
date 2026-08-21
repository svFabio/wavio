import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalReprogramarContainer as ModalReprogramar } from '../../containers/ModalReprogramar.container';
import type { EventoCalendario } from '../../types';

const mockCita: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2026-01-10T14:30:00'),
  end: new Date('2026-01-10T15:30:00'),
  resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1', servicioId: 1 },
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  cita: mockCita,
  onSubmit: vi.fn(),
};

vi.mock('../../../../shared/hooks/useModalAccessibility', () => ({
  useModalAccessibility: vi.fn(() => ({ handleKeyDown: vi.fn() })),
}));

vi.mock('../../api/useHorariosDisponiblesQuery', () => ({
  useHorariosDisponiblesQuery: vi.fn(),
}));

import { useHorariosDisponiblesQuery } from '../../api/useHorariosDisponiblesQuery';

const mockedUseHorarios = vi.mocked(useHorariosDisponiblesQuery);

describe('ModalReprogramar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseHorarios.mockReturnValue({
      data: ['10:00', '11:00', '14:00', '15:00', '16:00'],
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders nothing when isOpen is false', () => {
    mockedUseHorarios.mockReturnValue({ data: [], isLoading: false } as any);
    const { container } = render(<ModalReprogramar {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and close button', () => {
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('Reprogramar Cita')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('displays current cita info', () => {
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Cita Actual')).toBeInTheDocument();
  });

  it('shows horarios disponibles as buttons', () => {
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('shows loading state for horarios', () => {
    mockedUseHorarios.mockReturnValue({ data: [], isLoading: true } as any);
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('Buscando espacios...')).toBeInTheDocument();
  });

  it('shows empty horarios message', () => {
    mockedUseHorarios.mockReturnValue({ data: [], isLoading: false } as any);
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('No hay horarios disponibles para esta fecha')).toBeInTheDocument();
  });

  it('allows selecting a new horario', async () => {
    const user = userEvent.setup();
    render(<ModalReprogramar {...defaultProps} />);
    await user.click(screen.getByText('11:00'));
    expect(screen.getByText('11:00').className).toContain('bg-primary');
  });

  it('calls onSubmit with correct params when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const { container } = render(<ModalReprogramar {...defaultProps} onSubmit={onSubmit} />);
    await user.click(screen.getByText('11:00'));
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('1', '2026-01-10', '11:00');
    });
  });

  it('calls onClose after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();
    const { container } = render(
      <ModalReprogramar {...defaultProps} onSubmit={onSubmit} onClose={onClose} />,
    );
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows error when submit fails', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: 'Horario ocupado' });
    const { container } = render(<ModalReprogramar {...defaultProps} onSubmit={onSubmit} />);
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Horario ocupado')).toBeInTheDocument();
    });
  });

  it('submit button is enabled when horario is pre-set from cita', () => {
    render(<ModalReprogramar {...defaultProps} />);
    expect(screen.getByText('Confirmar Cambio').closest('button')).toBeEnabled();
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ModalReprogramar {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });
});
