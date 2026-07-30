import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PageHeaderSkeleton } from '../PageHeaderSkeleton';

describe('PageHeaderSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PageHeaderSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('renders skeleton elements', () => {
    const { container } = render(<PageHeaderSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
