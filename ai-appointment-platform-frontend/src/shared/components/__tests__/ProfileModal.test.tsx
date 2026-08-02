import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { ProfileModal } from '../ProfileModal';

vi.mock('../../../shared/hooks/useModalAccessibility', () => ({
  useModalAccessibility: () => ({ handleKeyDown: vi.fn() }),
}));

const mockUsuario = {
  id: 1,
  nombre: 'Test User',
  email: 'test@wavio.com',
  rol: 'ADMIN' as const,
  fotoPerfil: 'https://example.com/avatar.jpg',
};

describe('ProfileModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithProviders(<ProfileModal isOpen={false} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when usuario is null', () => {
    const { container } = renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: null },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal title when open', () => {
    renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    expect(screen.getByText('Personalizar Perfil')).toBeInTheDocument();
  });

  it('displays user email', () => {
    renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    expect(screen.getByText('test@wavio.com')).toBeInTheDocument();
  });

  it('displays user role', () => {
    renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<ProfileModal isOpen={true} onClose={onClose} />, {
      auth: { usuario: mockUsuario },
    });
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with dialog role and correct aria attributes', () => {
    renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Personalizar perfil');
  });

  it('renders user avatar image when fotoPerfil is set', () => {
    renderWithProviders(<ProfileModal isOpen={true} onClose={vi.fn()} />, {
      auth: { usuario: mockUsuario },
    });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Test User');
  });
});
