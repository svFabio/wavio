import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ModalNuevaCita } from '../ModalNuevaCita';

const defaultProps = {
  handleClose: vi.fn(),
  isLarge: false,
  children: <div data-testid="child">Form content</div>,
};

describe('ModalNuevaCita', () => {
  it('renders the modal with title and close button', () => {
    render(<ModalNuevaCita {...defaultProps} />);
    expect(screen.getByText('Nueva Cita')).toBeInTheDocument();
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ModalNuevaCita {...defaultProps} />);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('renders with large max width when isLarge is true', () => {
    const { container } = render(<ModalNuevaCita {...defaultProps} isLarge={true} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.className).toContain('max-w-lg');
  });

  it('renders with default max width when isLarge is false', () => {
    const { container } = render(<ModalNuevaCita {...defaultProps} isLarge={false} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.className).toContain('max-w-md');
  });

  it('calls handleClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<ModalNuevaCita {...defaultProps} handleClose={handleClose} />);
    await user.click(screen.getByLabelText('Cerrar'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('sets aria-modal and aria-label attributes', () => {
    render(<ModalNuevaCita {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Nueva Cita');
  });
});
