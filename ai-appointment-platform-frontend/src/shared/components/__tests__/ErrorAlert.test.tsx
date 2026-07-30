import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '../ErrorAlert';

describe('ErrorAlert', () => {
  it('renders error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders alert icon', () => {
    const { container } = render(<ErrorAlert message="Error" />);
    const svg = container.querySelector('svg.lucide-circle-alert');
    expect(svg).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.queryByLabelText('Reintentar')).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorAlert message="Error" onRetry={vi.fn()} />);
    expect(screen.getByLabelText('Reintentar')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByLabelText('Reintentar'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders with correct styling', () => {
    render(<ErrorAlert message="Error" />);
    const alertDiv = screen.getByText('Error').parentElement;
    expect(alertDiv!.className).toContain('bg-danger-light');
  });
});
