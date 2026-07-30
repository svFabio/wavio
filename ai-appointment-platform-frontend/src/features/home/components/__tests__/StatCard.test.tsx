import { render, screen } from '@testing-library/react';
import { Calendar } from 'lucide-react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(
      <StatCard
        label="Citas Hoy"
        value={5}
        icon={Calendar}
        gradient="from-primary to-secondary"
        glow="0 4px 14px -3px var(--color-primary-glow)"
      />,
    );
    expect(screen.getByText('Citas Hoy')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(
      <StatCard
        label="Ingresos"
        value="Bs. 1000"
        icon={Calendar}
        gradient="from-primary to-secondary"
        glow="0 4px 14px -3px var(--color-primary-glow)"
      />,
    );
    expect(screen.getByText('Bs. 1000')).toBeInTheDocument();
  });
});
