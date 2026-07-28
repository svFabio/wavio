import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalShell } from '../ModalShell';

describe('ModalShell', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ModalShell {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with title and children when isOpen is true', () => {
    render(<ModalShell {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<ModalShell {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Modal');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ModalShell {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ModalShell {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies sm size class', () => {
    render(<ModalShell {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
  });

  it('applies md size class by default', () => {
    render(<ModalShell {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');
  });

  it('applies lg size class', () => {
    render(<ModalShell {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');
  });

  it('renders children correctly', () => {
    render(
      <ModalShell {...defaultProps}>
        <p>Custom child content</p>
      </ModalShell>,
    );
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });
});
