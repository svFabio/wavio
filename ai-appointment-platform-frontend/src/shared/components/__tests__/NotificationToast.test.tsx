import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationToast } from '../NotificationToast';

describe('NotificationToast', () => {
  const defaultProps = {
    id: 'toast-1',
    clienteNombre: 'Juan Perez',
    fecha: '2026-05-15',
    horario: '14:00',
    onDismiss: vi.fn(),
  };

  it('renders client name', () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('renders new cita title', () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByText('Nueva Cita')).toBeInTheDocument();
  });

  it('renders date and time', () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByText('2026-05-15 a las 14:00')).toBeInTheDocument();
  });

  it('renders swipe hint on mobile', () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByText('Desliza hacia arriba para cerrar')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<NotificationToast {...defaultProps} />);
    expect(screen.getByLabelText('Cerrar notificacion')).toBeInTheDocument();
  });

  it('calls onDismiss after clicking the toast body', () => {
    const onDismiss = vi.fn();
    render(<NotificationToast {...defaultProps} onDismiss={onDismiss} />);
    const toast = screen.getByText('Nueva Cita').closest('div[class*="bg-surface"]');
    fireEvent.click(toast!);
    setTimeout(() => {
      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    }, 350);
  });

  it('calls onDismiss after clicking close button', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NotificationToast {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Cerrar notificacion'));
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onDismiss).toHaveBeenCalledWith('toast-1');
    vi.useRealTimers();
  });

  it('starts invisible and becomes visible after animation frame', () => {
    vi.useFakeTimers();
    const { container } = render(<NotificationToast {...defaultProps} />);
    const toast = container.firstChild as HTMLElement;
    expect(toast.className).toContain('opacity-0');
    act(() => {
      vi.advanceTimersByTime(15);
    });
    expect(toast.className).toContain('opacity-100');
    vi.useRealTimers();
  });

  it('close button click does not trigger outer toast click handler', () => {
    const onDismiss = vi.fn();
    render(<NotificationToast {...defaultProps} onDismiss={onDismiss} />);
    vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText('Cerrar notificacion'));
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
