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
    expect(screen.getByText('No hay citas programadas para hoy')).toBeInTheDocument();
  });

  it('renders cita rows', () => {
    render(<AgendaTable citas={citas} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.getByText('VALIDACION_PENDIENTE')).toBeInTheDocument();
  });
});
