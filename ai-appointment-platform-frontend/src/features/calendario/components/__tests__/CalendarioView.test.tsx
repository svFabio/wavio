import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { CalendarioView } from '../CalendarioView';
import type { EventoCalendario } from '../../types';

const mockEvent: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2026-01-10T10:00:00'),
  end: new Date('2026-01-10T11:00:00'),
  resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1' },
};

const defaultProps = {
  eventos: [mockEvent],
  vista: Views.MONTH as View,
  fecha: new Date('2026-01-10'),
  scrollToTime: new Date('2026-01-10T08:00:00'),
  eventStyleGetter: vi.fn(() => ({ style: {} })),
  onNavigateFecha: vi.fn(),
  onNavigateVista: vi.fn(),
  onSelectSlot: vi.fn(),
  onSelectEvent: vi.fn(),
  onNuevaCita: vi.fn(),
  citaSeleccionada: null as EventoCalendario | null,
  onCerrarDetalle: vi.fn(),
  onReprogramarDesdeDetalle: vi.fn(),
  onNoAsistio: vi.fn(),
  onGuardarDescripcion: vi.fn(),
  isLoadingNoShow: false,
  modalReprogramarAbierto: false,
  onCerrarReprogramar: vi.fn(),
  onReprogramarCita: vi.fn(),
};

vi.mock('react-big-calendar', () => ({
  Calendar: vi.fn(function ({ events, ..._rest }: any) {
    return (
      <div data-testid="rbc-calendar" data-events-count={events.length}>
        RBC Calendar
      </div>
    );
  }),
  Views: { MONTH: 'month', WEEK: 'week', DAY: 'day' },
  dateFnsLocalizer: vi.fn(() => ({})),
}));

vi.mock('../ModalDetalle', () => ({
  ModalDetalle: vi.fn(({ event, onClose }) => (
    <div data-testid="modal-detalle">
      <span>Detalle: {event.title}</span>
      <button onClick={onClose}>Cerrar Detalle</button>
    </div>
  )),
}));

vi.mock('../ModalReprogramar', () => ({
  ModalReprogramar: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="modal-reprogramar">
        <button onClick={onClose}>Cerrar Reprogramar</button>
      </div>
    ) : null,
  ),
}));

describe('CalendarioView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the calendar', () => {
    render(<CalendarioView {...defaultProps} />);
    expect(screen.getByTestId('rbc-calendar')).toBeInTheDocument();
  });

  it('passes eventos to calendar', () => {
    render(<CalendarioView {...defaultProps} eventos={[mockEvent]} />);
    const calendar = screen.getByTestId('rbc-calendar');
    expect(calendar.getAttribute('data-events-count')).toBe('1');
  });

  it('does not render ModalDetalle when citaSeleccionada is null', () => {
    render(<CalendarioView {...defaultProps} citaSeleccionada={null} />);
    expect(screen.queryByTestId('modal-detalle')).not.toBeInTheDocument();
  });

  it('renders ModalDetalle when citaSeleccionada is provided', () => {
    render(<CalendarioView {...defaultProps} citaSeleccionada={mockEvent} />);
    expect(screen.getByTestId('modal-detalle')).toBeInTheDocument();
    expect(screen.getByText('Detalle: Juan Pérez')).toBeInTheDocument();
  });

  it('does not render ModalReprogramar when modalReprogramarAbierto is false', () => {
    render(<CalendarioView {...defaultProps} modalReprogramarAbierto={false} />);
    expect(screen.queryByTestId('modal-reprogramar')).not.toBeInTheDocument();
  });

  it('renders ModalReprogramar when modalReprogramarAbierto is true and citaReprogramar is set', () => {
    render(
      <CalendarioView
        {...defaultProps}
        modalReprogramarAbierto={true}
        citaReprogramar={mockEvent}
      />,
    );
    expect(screen.getByTestId('modal-reprogramar')).toBeInTheDocument();
  });
});
