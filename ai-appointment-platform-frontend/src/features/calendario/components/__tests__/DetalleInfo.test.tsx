import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DetalleInfo } from '../DetalleInfo';
import type { EventoCalendario } from '../../types';

const citaEvent: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2026-01-10T10:00:00'),
  end: new Date('2026-01-10T11:00:00'),
  resource: {
    tipo: 'cita',
    estado: 'CONFIRMADA',
    citaId: '1',
    telefono: '59170000000',
    servicio: 'Corte de cabello',
    origen: 'virtual',
    descripcion: 'nota existente',
  },
};

const resumenEvent: EventoCalendario = {
  id: 'sum-1',
  title: '3 citas',
  start: new Date('2026-01-10'),
  end: new Date('2026-01-10'),
  resource: { tipo: 'resumen', estado: 'INFO' },
};

const defaultProps = {
  event: citaEvent,
  descripcion: '',
  onDescripcionChange: vi.fn(),
  guardando: false,
  guardado: false,
  error: null as string | null,
  onGuardar: vi.fn(),
};

describe('DetalleInfo', () => {
  it('renders client name', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('renders telephone', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('59170000000')).toBeInTheDocument();
  });

  it('renders "No registrado" when telefono is missing', () => {
    const noTelEvent = { ...citaEvent, resource: { ...citaEvent.resource!, telefono: undefined } };
    render(<DetalleInfo {...defaultProps} event={noTelEvent} />);
    expect(screen.getByText('No registrado')).toBeInTheDocument();
  });

  it('renders service name', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
  });

  it('renders date and time', () => {
    render(<DetalleInfo {...defaultProps} />);
    // Both times render in a single <p>: "10:00 - 11:00"
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
  });

  it('renders status badge based on estado', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('renders origen badge', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('Virtual')).toBeInTheDocument();
  });

  it('renders presencial badge when origen is presencial', () => {
    const presencialEvent = {
      ...citaEvent,
      resource: { ...citaEvent.resource!, origen: 'presencial' },
    };
    render(<DetalleInfo {...defaultProps} event={presencialEvent} />);
    expect(screen.getByText('Presencial')).toBeInTheDocument();
  });

  it('renders estado badges for different states', () => {
    const estados: Array<[string, string]> = [
      ['VALIDAR', 'Validar Pago'],
      ['PENDIENTE_PAGO', 'Pendiente de Pago'],
      ['NO_ASISTIO', 'No Asistio'],
    ];
    for (const [estado, label] of estados) {
      const e = { ...citaEvent, resource: { ...citaEvent.resource!, estado } };
      const { unmount } = render(<DetalleInfo {...defaultProps} event={e} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('shows notas section for cita events', () => {
    render(<DetalleInfo {...defaultProps} />);
    expect(screen.getByText('Notas del Admin')).toBeInTheDocument();
  });

  it('does not show notas section for resumen events', () => {
    render(<DetalleInfo {...defaultProps} event={resumenEvent} />);
    expect(screen.queryByText('Notas del Admin')).not.toBeInTheDocument();
  });

  it('displays existing descripcion in textarea', () => {
    render(<DetalleInfo {...defaultProps} descripcion="nota existente" />);
    expect(screen.getByDisplayValue('nota existente')).toBeInTheDocument();
  });

  it('calls onDescripcionChange when textarea changes', async () => {
    const user = userEvent.setup();
    const onDescripcionChange = vi.fn();
    render(<DetalleInfo {...defaultProps} onDescripcionChange={onDescripcionChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'n');
    expect(onDescripcionChange).toHaveBeenCalled();
  });

  it('shows guardando spinner', () => {
    render(<DetalleInfo {...defaultProps} guardando={true} />);
    expect(screen.getByLabelText('Guardar notas')).toBeDisabled();
  });

  it('shows guardado check', () => {
    render(<DetalleInfo {...defaultProps} guardado={true} />);
    expect(screen.getByText('Guardado')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<DetalleInfo {...defaultProps} error="Error al guardar" />);
    expect(screen.getByText('Error al guardar')).toBeInTheDocument();
  });

  it('calls onGuardar when save button is clicked', async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn();
    render(<DetalleInfo {...defaultProps} onGuardar={onGuardar} />);
    await user.click(screen.getByLabelText('Guardar notas'));
    expect(onGuardar).toHaveBeenCalled();
  });
});
