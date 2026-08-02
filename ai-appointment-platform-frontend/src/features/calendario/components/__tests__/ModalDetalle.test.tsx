import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalDetalle } from '../ModalDetalle';
import type { EventoCalendario } from '../../types';

const mockEvent: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2026-01-10T10:00:00'),
  end: new Date('2026-01-10T11:00:00'),
  resource: {
    tipo: 'cita',
    estado: 'CONFIRMADA',
    citaId: '1',
    telefono: '59170000000',
    servicio: 'Corte',
    origen: 'virtual',
    descripcion: '',
  },
};

const defaultProps = {
  event: mockEvent,
  onClose: vi.fn(),
  onReprogramar: vi.fn(),
  onNoAsistio: vi.fn(),
  onGuardarDescripcion: vi.fn().mockResolvedValue({ success: true }),
  isLoadingNoShow: false,
};

vi.mock('../../../../shared/hooks/useModalAccessibility', () => ({
  useModalAccessibility: vi.fn(() => ({ handleKeyDown: vi.fn() })),
}));

vi.mock('../DetalleInfo', () => ({
  DetalleInfo: vi.fn(
    ({ onGuardar, event, descripcion, onDescripcionChange, guardando, guardado, error }) => (
      <div data-testid="detalle-info">
        <span>{event.title}</span>
        <textarea
          data-testid="descripcion-input"
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
        />
        <button onClick={onGuardar} data-testid="guardar-btn">
          Guardar
        </button>
        {guardando && <span data-testid="guardando">Guardando...</span>}
        {guardado && <span data-testid="guardado">Guardado</span>}
        {error && <span data-testid="error-msg">{error}</span>}
      </div>
    ),
  ),
}));

vi.mock('../DetalleAcciones', () => ({
  DetalleAcciones: vi.fn(({ onReprogramar, onNoAsistio, onClose, isLoadingNoShow }) => (
    <div data-testid="detalle-acciones">
      <button onClick={onReprogramar} data-testid="reprogramar-btn">
        Reprogramar
      </button>
      <button onClick={onNoAsistio} data-testid="no-asistio-btn">
        No Asistio
      </button>
      <button onClick={onClose} data-testid="cerrar-btn">
        Cerrar
      </button>
      {isLoadingNoShow && <span data-testid="loading-no-show">Loading</span>}
    </div>
  )),
}));

describe('ModalDetalle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when event is null', () => {
    const { container } = render(<ModalDetalle {...defaultProps} event={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders DetalleInfo and DetalleAcciones', () => {
    render(<ModalDetalle {...defaultProps} />);
    expect(screen.getByTestId('detalle-info')).toBeInTheDocument();
    expect(screen.getByTestId('detalle-acciones')).toBeInTheDocument();
  });

  it('renders title and close button', () => {
    render(<ModalDetalle {...defaultProps} />);
    expect(screen.getByText('Detalles de la Cita')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ModalDetalle {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('saves description and shows guardado temporarily', async () => {
    const user = userEvent.setup();
    const onGuardarDescripcion = vi.fn().mockResolvedValue({ success: true });
    render(<ModalDetalle {...defaultProps} onGuardarDescripcion={onGuardarDescripcion} />);
    await user.click(screen.getByTestId('guardar-btn'));
    expect(onGuardarDescripcion).toHaveBeenCalledWith('1', '');
    expect(screen.getByTestId('guardado')).toBeInTheDocument();
  });

  it('shows error when save fails', async () => {
    const user = userEvent.setup();
    const onGuardarDescripcion = vi.fn().mockResolvedValue({ success: false });
    render(<ModalDetalle {...defaultProps} onGuardarDescripcion={onGuardarDescripcion} />);
    await user.click(screen.getByTestId('guardar-btn'));
    expect(screen.getByTestId('error-msg')).toHaveTextContent('No se pudo guardar');
  });

  it('handles unexpected error on save', async () => {
    const user = userEvent.setup();
    const onGuardarDescripcion = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<ModalDetalle {...defaultProps} onGuardarDescripcion={onGuardarDescripcion} />);
    await user.click(screen.getByTestId('guardar-btn'));
    expect(screen.getByTestId('error-msg')).toHaveTextContent('Network error');
  });

  it('passes isLoadingNoShow to DetalleAcciones', () => {
    render(<ModalDetalle {...defaultProps} isLoadingNoShow={true} />);
    expect(screen.getByTestId('loading-no-show')).toBeInTheDocument();
  });

  it('does nothing when save is triggered without citaId', async () => {
    const eventNoId: EventoCalendario = {
      ...mockEvent,
      resource: { tipo: 'cita', estado: 'CONFIRMADA' },
    };
    const onGuardarDescripcion = vi.fn();
    render(
      <ModalDetalle
        {...defaultProps}
        event={eventNoId}
        onGuardarDescripcion={onGuardarDescripcion}
      />,
    );
    await userEvent.setup().click(screen.getByTestId('guardar-btn'));
    expect(onGuardarDescripcion).not.toHaveBeenCalled();
  });
});
