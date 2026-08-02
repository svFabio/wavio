import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DetalleAcciones } from '../DetalleAcciones';
import type { EventoCalendario } from '../../types';

const pastEvent: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2025-01-10T10:00:00'),
  end: new Date('2025-01-10T11:00:00'),
  resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1' },
};

const futureEvent: EventoCalendario = {
  id: '2',
  title: 'Futura',
  start: new Date('2030-01-10T10:00:00'),
  end: new Date('2030-01-10T11:00:00'),
  resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '2' },
};

const noShowEvent: EventoCalendario = {
  id: '3',
  title: 'No Show',
  start: new Date('2025-01-10T10:00:00'),
  end: new Date('2025-01-10T11:00:00'),
  resource: { tipo: 'cita', estado: 'NO_ASISTIO', citaId: '3' },
};

const resumenEvent: EventoCalendario = {
  id: 'sum-1',
  title: '3 citas',
  start: new Date('2025-01-10'),
  end: new Date('2025-01-10'),
  resource: { tipo: 'resumen', estado: 'INFO' },
};

const defaultProps = {
  event: pastEvent,
  onReprogramar: vi.fn(),
  onNoAsistio: vi.fn(),
  onClose: vi.fn(),
  isLoadingNoShow: false,
};

describe('DetalleAcciones', () => {
  it('renders Reprogramar and Cerrar buttons for a cita event', () => {
    render(<DetalleAcciones {...defaultProps} />);
    expect(screen.getByText('Reprogramar')).toBeInTheDocument();
    expect(screen.getByText('Cerrar')).toBeInTheDocument();
  });

  it('does not render Reprogramar button for a resumen event', () => {
    render(<DetalleAcciones {...defaultProps} event={resumenEvent} />);
    expect(screen.queryByText('Reprogramar')).not.toBeInTheDocument();
  });

  it('renders "Marcar No Asistio" for a past CONFIRMADA event', () => {
    render(<DetalleAcciones {...defaultProps} />);
    expect(screen.getByText('Marcar No Asistio')).toBeInTheDocument();
  });

  it('renders "Marcar como Asistio" for a NO_ASISTIO event', () => {
    render(<DetalleAcciones {...defaultProps} event={noShowEvent} />);
    expect(screen.getByText('Marcar como Asistio')).toBeInTheDocument();
  });

  it('does not render no-show button for future events', () => {
    render(<DetalleAcciones {...defaultProps} event={futureEvent} />);
    expect(screen.queryByText('Marcar No Asistio')).not.toBeInTheDocument();
  });

  it('shows loader when isLoadingNoShow is true', () => {
    const { container } = render(<DetalleAcciones {...defaultProps} isLoadingNoShow={true} />);
    const spinner = container.querySelector('.lucide-loader-circle');
    expect(spinner).toBeInTheDocument();
    expect(spinner?.closest('button')).toBeDisabled();
  });

  it('calls onReprogramar when Reprogramar is clicked', async () => {
    const user = userEvent.setup();
    const onReprogramar = vi.fn();
    render(<DetalleAcciones {...defaultProps} onReprogramar={onReprogramar} />);
    await user.click(screen.getByText('Reprogramar'));
    expect(onReprogramar).toHaveBeenCalled();
  });

  it('calls onClose when Cerrar is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DetalleAcciones {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onNoAsistio when the no-show button is clicked', async () => {
    const user = userEvent.setup();
    const onNoAsistio = vi.fn();
    render(<DetalleAcciones {...defaultProps} onNoAsistio={onNoAsistio} />);
    await user.click(screen.getByText('Marcar No Asistio'));
    expect(onNoAsistio).toHaveBeenCalled();
  });
});
