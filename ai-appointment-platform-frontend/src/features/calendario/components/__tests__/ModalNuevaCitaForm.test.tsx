import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ModalNuevaCitaForm } from '../ModalNuevaCitaForm';
import type { DatosNuevaCita } from '../../types';
import type { Servicio } from '../../../../types';
import type { Configuracion } from '../../../configuracion/types/domain';
import type { Usuario } from '../../../../types';

const servicios: Servicio[] = [
  { id: 1, nombre: 'Corte', duracionMinutos: 30, bufferMinutos: 5, precio: 100, activo: true },
  { id: 2, nombre: 'Spa', duracionMinutos: 60, bufferMinutos: 10, precio: 200, activo: true },
];

const staffList: Usuario[] = [{ id: 1, nombre: 'Alice', email: 'alice@test.com', rol: 'STAFF' }];

const config: Configuracion = {
  cobrarAdelanto: false,
  porcentajeAdelanto: 0,
};

const formData: DatosNuevaCita = {
  clienteNombre: '',
  clienteTelefono: '',
  fecha: '2026-01-15',
  horario: '',
  servicioId: 1,
  staffId: undefined,
  esRecurrente: false,
  recurrence: undefined,
  recurrenceEnd: undefined,
};

const defaultProps = {
  formData,
  setFormData: vi.fn() as unknown as React.Dispatch<React.SetStateAction<DatosNuevaCita>>,
  handleSubmit: vi.fn(),
  handleClose: vi.fn(),
  loading: false,
  error: null as string | null,
  servicios,
  staffList,
  config,
  horariosDisponibles: ['10:00', '11:00', '14:00'],
  loadingHorarios: false,
};

vi.mock('../ClientInfoInputs', () => ({
  ClientInfoInputs: vi.fn(({ nombre, telefono, onNombreChange, onTelefonoChange }) => (
    <div data-testid="client-info-inputs">
      <input
        data-testid="mock-nombre"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
      />
      <input
        data-testid="mock-telefono"
        value={telefono}
        onChange={(e) => onTelefonoChange(e.target.value)}
      />
    </div>
  )),
}));

vi.mock('../StaffSelect', () => ({
  StaffSelect: vi.fn(() => <div data-testid="staff-select" />),
}));

vi.mock('../HorariosGrid', () => ({
  HorariosGrid: vi.fn(({ horarios, selected, onSelect, loading }) => (
    <div data-testid="horarios-grid">
      {loading ? (
        <span>Cargando...</span>
      ) : (
        horarios.map((h: string) => (
          <button key={h} onClick={() => onSelect(h)} data-testid={`hora-${h}`}>
            {h}
          </button>
        ))
      )}
      <span data-testid="selected-hora">{selected}</span>
    </div>
  )),
}));

vi.mock('../ResumenPrecio', () => ({
  ResumenPrecio: vi.fn(() => <div data-testid="resumen-precio" />),
}));

vi.mock('../RecurrenciaSection', () => ({
  RecurrenciaSection: vi.fn(() => <div data-testid="recurrencia-section" />),
  calcularFechaFinPorDefecto: vi.fn(() => '2026-02-15'),
}));

describe('ModalNuevaCitaForm', () => {
  it('renders all sub-components', () => {
    render(<ModalNuevaCitaForm {...defaultProps} />);
    expect(screen.getByTestId('client-info-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('staff-select')).toBeInTheDocument();
    expect(screen.getByTestId('horarios-grid')).toBeInTheDocument();
    expect(screen.getByTestId('resumen-precio')).toBeInTheDocument();
    expect(screen.getByTestId('recurrencia-section')).toBeInTheDocument();
  });

  it('renders date and servicio selects', () => {
    render(<ModalNuevaCitaForm {...defaultProps} />);
    expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders Cancelar and Crear Cita buttons', () => {
    render(<ModalNuevaCitaForm {...defaultProps} />);
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Crear Cita')).toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<ModalNuevaCitaForm {...defaultProps} error="Nombre requerido" />);
    expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
  });

  it('calls handleSubmit on form submission', () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <ModalNuevaCitaForm
        {...defaultProps}
        formData={{ ...formData, horario: '10:00' }}
        handleSubmit={handleSubmit}
      />,
    );
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('calls handleClose when Cancelar is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<ModalNuevaCitaForm {...defaultProps} handleClose={handleClose} />);
    await user.click(screen.getByText('Cancelar'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('disables submit button when loading is true', () => {
    const { container } = render(<ModalNuevaCitaForm {...defaultProps} loading={true} />);
    const spinner = container.querySelector('.lucide-loader-circle');
    expect(spinner).toBeInTheDocument();
    expect(spinner?.closest('button')).toBeDisabled();
  });

  it('disables submit button when horario is empty', () => {
    render(<ModalNuevaCitaForm {...defaultProps} formData={{ ...formData, horario: '' }} />);
    expect(screen.getByText('Crear Cita').closest('button')).toBeDisabled();
  });

  it('enables submit button when horario is selected and not loading', () => {
    render(<ModalNuevaCitaForm {...defaultProps} formData={{ ...formData, horario: '10:00' }} />);
    expect(screen.getByText('Crear Cita').closest('button')).toBeEnabled();
  });

  it('passes horarios to HorariosGrid', () => {
    render(<ModalNuevaCitaForm {...defaultProps} />);
    expect(screen.getByTestId('hora-10:00')).toBeInTheDocument();
    expect(screen.getByTestId('hora-14:00')).toBeInTheDocument();
  });
});
