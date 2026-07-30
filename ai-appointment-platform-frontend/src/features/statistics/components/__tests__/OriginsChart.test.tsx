import { render, screen } from '@testing-library/react';
import { OriginsChart } from '../OriginsChart';

describe('OriginsChart', () => {
  it('renders empty state when total is 0', () => {
    render(
      <OriginsChart
        data={[
          { name: 'Virtual', value: 0 },
          { name: 'Presencial', value: 0 },
        ]}
        total={0}
      />,
    );
    expect(screen.getByText('Sin datos este mes')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    const data = [
      { name: 'Virtual', value: 6 },
      { name: 'Presencial', value: 4 },
    ];
    render(<OriginsChart data={data} total={10} />);
    expect(screen.getByText('Virtual')).toBeInTheDocument();
    expect(screen.getByText('Presencial')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<OriginsChart data={[]} total={0} />);
    expect(screen.getByText('Origen de Citas')).toBeInTheDocument();
  });
});
