import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  // Suppress console.error during expected error boundary catches
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error thrown" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Test error thrown')).toBeInTheDocument();
  });

  it('renders custom fallback if provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error View</div>}>
        <ThrowError message="Test error thrown" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom Error View')).toBeInTheDocument();
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });

  it('can reset error state by clicking try again button', async () => {
    // We use a wrapper with state to conditionally throw the error
    let shouldThrow = true;
    const BuggyComponent = () => {
      if (shouldThrow) throw new Error('First time crash');
      return <div>Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('First time crash')).toBeInTheDocument();

    // Fix the bug and click try again
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
