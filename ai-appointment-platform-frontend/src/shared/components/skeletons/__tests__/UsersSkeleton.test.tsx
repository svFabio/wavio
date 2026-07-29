import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UsersSkeleton } from '../UsersSkeleton';

describe('UsersSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<UsersSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<UsersSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
