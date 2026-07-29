import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../RevenueChart';

describe('RevenueChart', () => {
  it('renders the chart title', () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByText('Ingresos por Mes')).toBeInTheDocument();
  });

  it('renders with revenue data', () => {
    const data = [
      { mes: '2026-01', mesLabel: 'Ene', total: 1000 },
      { mes: '2026-02', mesLabel: 'Feb', total: 2000 },
    ];
    const { container } = render(<RevenueChart data={data} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
