import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders navigation links for General section', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
    expect(screen.getByText('Lista de Espera')).toBeInTheDocument();
    expect(screen.getByText('Validar Pagos')).toBeInTheDocument();
    expect(screen.getByText('Chat WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Vincular WhatsApp')).toBeInTheDocument();
  });

  it('renders admin links when user is admin', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, { auth: { isAdmin: true } });
    expect(screen.getByText('Estadisticas')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.getByText('Configuracion')).toBeInTheDocument();
  });

  it('does not render admin links when user is not admin', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, { auth: { isAdmin: false } });
    expect(screen.queryByText('Estadisticas')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Asistente')).not.toBeInTheDocument();
    expect(screen.queryByText('Configuracion')).not.toBeInTheDocument();
  });

  it('shows mobile close button and calls onClose when clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<Sidebar {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Cerrar menu');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when a nav link is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<Sidebar {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders theme toggle button', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Modo Oscuro')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Cerrar Sesion')).toBeInTheDocument();
  });

  it('renders profile button with user name', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, {
      auth: { usuario: { id: 1, nombre: 'Test User', email: 'test@test.com', rol: 'ADMIN' } },
    });
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders version badge', () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    expect(screen.getByText('v1.0.0 PRO')).toBeInTheDocument();
  });

  it('navigates with correct link paths and highlights active link', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, { route: '/dashboard' });
    const inicioLink = screen.getByText('Inicio').closest('a');
    expect(inicioLink).toHaveAttribute('href', '/dashboard');
  });

  it('applies active styling to current route link', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, { route: '/dashboard/calendario' });
    const calendarioLink = screen.getByText('Calendario').closest('a');
    expect(calendarioLink).toHaveClass('bg-surface-elevated');
  });
});
