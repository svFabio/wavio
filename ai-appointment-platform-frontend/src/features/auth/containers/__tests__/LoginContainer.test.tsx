import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { LoginContainer } from '../LoginContainer.container';

vi.mock('../../../../lib/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    loginConGoogle: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  };
});

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}));

import { api } from '../../../../lib/api';

describe('LoginContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login view', () => {
    renderWithProviders(<LoginContainer />);
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Credenciales incorrectas'));
    const user = userEvent.setup();
    renderWithProviders(<LoginContainer />);

    await user.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Contrasena'), 'wrong');
    await user.click(screen.getByText('Iniciar sesion'));

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
  });
});
