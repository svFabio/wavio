import { render, screen } from '@testing-library/react';
import { StatisticsView } from '../StatisticsView';
import type { Cliente } from '../../../../types';

const overview = {
  citasMes: 10,
  ingresosMes: 5000,
  citasVirtuales: 6,
  citasPresenciales: 4,
  topClientes: [{ nombre: 'Juan Perez', telefono: '59170000000', totalCitas: 5 }],
  horariosPopulares: [
    { horario: '10:00', totalReservas: 8 },
    { horario: '14:00', totalReservas: 5 },
  ],
};

const revenue = {
  revenue: [
    { mes: '2026-01', total: 1000 },
    { mes: '2026-02', total: 2000 },
  ],
};

const clientes: Cliente[] = [];

describe('StatisticsView', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(
      <StatisticsView overview={null} revenue={null} loading={true} clientes={[]} />,
    );
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders stat cards with data', () => {
    render(
      <StatisticsView overview={overview} revenue={revenue} loading={false} clientes={clientes} />,
    );
    expect(screen.getByText('Estadisticas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Bs. 5000')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders empty stats when overview is null', () => {
    render(<StatisticsView overview={null} revenue={null} loading={false} clientes={[]} />);
    expect(screen.getByText('Estadisticas')).toBeInTheDocument();
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();
  });
});
