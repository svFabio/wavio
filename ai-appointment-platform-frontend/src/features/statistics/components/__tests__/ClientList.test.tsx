import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test-utils';
import { ClientList } from '../ClientList';

describe('ClientList', () => {
  it('renders empty state when no clients', () => {
    renderWithProviders(<ClientList clientes={[]} />);
    expect(screen.getByText('Sin datos aun')).toBeInTheDocument();
  });

  it('renders client list with medals', () => {
    const clientes = [
      { nombre: 'Juan Perez', telefono: '59170000000', totalCitas: 10 },
      { nombre: 'Maria Gomez', telefono: '59171111111', totalCitas: 5 },
    ];
    renderWithProviders(<ClientList clientes={clientes} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Maria Gomez')).toBeInTheDocument();
    expect(screen.getByText('10 citas')).toBeInTheDocument();
    expect(screen.getByText('5 citas')).toBeInTheDocument();
  });

  it('shows blocked badge when client is blocked', () => {
    const clientes = [{ nombre: 'Juan Perez', telefono: '59170000000', totalCitas: 3 }];
    const allClientes = [
      {
        id: 1,
        nombre: 'Juan Perez',
        telefono: '59170000000',
        noShowCount: 2,
        blocked: true,
        createdAt: '',
        updatedAt: '',
        email: null,
        notas: null,
      },
    ];
    renderWithProviders(<ClientList clientes={clientes} allClientes={allClientes} />);
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generar enlace/i })).toBeInTheDocument();
  });

  it('shows no-show count when present', () => {
    const clientes = [{ nombre: 'Juan Perez', telefono: '59170000000', totalCitas: 3 }];
    const allClientes = [
      {
        id: 1,
        nombre: 'Juan Perez',
        telefono: '59170000000',
        noShowCount: 2,
        blocked: false,
        createdAt: '',
        updatedAt: '',
        email: null,
        notas: null,
      },
    ];
    renderWithProviders(<ClientList clientes={clientes} allClientes={allClientes} />);
    expect(screen.getByText('2 no-shows')).toBeInTheDocument();
  });
});
