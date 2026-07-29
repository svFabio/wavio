import { render, screen } from '@testing-library/react';
import { CitasChart } from '../CitasChart';

describe('CitasChart', () => {
  it('renders the chart title', () => {
    render(<CitasChart horarios={[]} />);
    expect(screen.getByText('Horarios Mas Reservados')).toBeInTheDocument();
  });

  it('renders with horario data', () => {
    const horarios = [
      { horario: '10:00', totalReservas: 5 },
      { horario: '14:00', totalReservas: 3 },
    ];
    const { container } = render(<CitasChart horarios={horarios} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
