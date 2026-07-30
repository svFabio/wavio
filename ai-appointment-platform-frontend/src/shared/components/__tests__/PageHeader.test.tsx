import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Dashboard" subtitle="Welcome back" />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('renders action element when provided', () => {
    render(<PageHeader title="Dashboard" action={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <PageHeader title="Dashboard">
        <div>Child Content</div>
      </PageHeader>,
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders action button and triggers onClick', () => {
    const onClick = vi.fn();
    render(<PageHeader title="Dashboard" action={<button onClick={onClick}>Action</button>} />);
    fireEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
