import { render, screen } from '@testing-library/react';
import { AgendaTable } from '../AgendaTable';
import type { CitaResumen } from '../../types';

const citas: CitaResumen[] = [
  {
    id: 'cita-1',
    clienteNombre: 'Juan Perez',
    clienteTelefono: '59170000000',
    horario: '10:00',
    estado: 'CONFIRMADA',
    servicio: 'Corte',
  },
  {
    id: 'cita-2',
    clienteNombre: null,
    clienteTelefono: '59171111111',
    horario: '11:00',
    estado: 'VALIDACION_PENDIENTE',
  },
];

describe('AgendaTable', () => {
  it('renders empty state', () => {
    render(<AgendaTable citas={[]} />);
    expect(screen.getAllByText('No hay citas programadas para hoy')[0]).toBeInTheDocument();
  });

  it('renders cita rows', () => {
    render(<AgendaTable citas={citas} />);
    expect(screen.getAllByText('Juan Perez')[0]).toBeInTheDocument();
    expect(screen.getAllByText('10:00')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Corte')[0]).toBeInTheDocument();
    // Estado badges render once per view; desktop + mobile = 2 each
    expect(screen.getAllByText('CONFIRMADA')[0]).toBeInTheDocument();
    expect(screen.getAllByText('VALIDACION_PENDIENTE')[0]).toBeInTheDocument();
  });
});
