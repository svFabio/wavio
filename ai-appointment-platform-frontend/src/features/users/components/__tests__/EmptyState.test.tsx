import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('Users EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No users registered')).toBeInTheDocument();
  });
});
