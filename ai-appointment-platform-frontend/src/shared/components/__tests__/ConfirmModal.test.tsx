import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure?',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and message when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders dialog with aria attributes', () => {
    render(<ConfirmModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-modal-title');
  });

  it('renders default confirm and cancel button text', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('renders custom confirm and cancel button text', () => {
    render(<ConfirmModal {...defaultProps} confirmText="Delete" cancelText="Go Back" />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render AlertTriangle icon when isDanger is false', () => {
    render(<ConfirmModal {...defaultProps} isDanger={false} />);
    expect(screen.queryByTestId('alert-triangle')).not.toBeInTheDocument();
  });

  it('renders AlertTriangle icon when isDanger is true', () => {
    render(<ConfirmModal {...defaultProps} isDanger={true} />);
    // lucide-react renders an svg; check confirm button has danger styling
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmBtn).toHaveClass('bg-danger');
  });

  it('confirm button has primary styling when isDanger is false', () => {
    render(<ConfirmModal {...defaultProps} isDanger={false} />);
    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmBtn).toHaveClass('bg-primary');
  });
});
