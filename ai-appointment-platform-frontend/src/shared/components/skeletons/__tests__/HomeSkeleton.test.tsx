import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HomeSkeleton } from '../HomeSkeleton';

describe('HomeSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<HomeSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<HomeSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
