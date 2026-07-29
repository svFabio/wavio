import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CalendarioSkeleton } from '../CalendarioSkeleton';

describe('CalendarioSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CalendarioSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<CalendarioSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
