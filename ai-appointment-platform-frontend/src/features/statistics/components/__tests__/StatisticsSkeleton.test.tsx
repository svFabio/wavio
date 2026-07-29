import { render, screen } from '@testing-library/react';
import { StatisticsSkeleton } from '../StatisticsSkeleton';

describe('StatisticsSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<StatisticsSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
