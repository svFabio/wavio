import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginView } from '../LoginView';
import type { LoginResponse, Tab } from '../../types';

const baseProps = {
  tab: 'login' as Tab,
  email: '',
  password: '',
  error: null,
  loading: false,
  pendingData: null,
  showPassword: false,
  onTabChange: vi.fn(),
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onShowPasswordToggle: vi.fn(),
  onSubmit: vi.fn(),
  onGoogleLogin: vi.fn(),
  onNegocioSelect: vi.fn(),
};

describe('LoginView', () => {
  it('renders login form', () => {
    render(<LoginView {...baseProps} />);
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contrasena')).toBeInTheDocument();
  });

  it('renders register form when tab is register', () => {
    render(<LoginView {...baseProps} tab="register" />);
    expect(screen.getByText('Crea tu cuenta gratis')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<LoginView {...baseProps} error="Credenciales incorrectas" />);
    expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
  });

  it('renders pending negocio selection', () => {
    const pendingData: LoginResponse = {
      token: 'token',
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' },
      negocios: [
        { id: 1, nombre: 'Negocio 1', plan: 'PRO' },
        { id: 2, nombre: 'Negocio 2', plan: 'FREE' },
      ],
    };
    render(<LoginView {...baseProps} pendingData={pendingData} />);
    expect(screen.getByText('Selecciona un negocio')).toBeInTheDocument();
    expect(screen.getByText('Negocio 1')).toBeInTheDocument();
    expect(screen.getByText('Negocio 2')).toBeInTheDocument();
  });

  it('calls onNegocioSelect when negocio clicked', async () => {
    const onNegocioSelect = vi.fn();
    const user = userEvent.setup();
    const pendingData: LoginResponse = {
      token: 'token',
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' },
      negocios: [{ id: 1, nombre: 'Negocio 1', plan: 'PRO' }],
    };
    render(
      <LoginView {...baseProps} pendingData={pendingData} onNegocioSelect={onNegocioSelect} />,
    );
    await user.click(screen.getByText('Negocio 1'));
    expect(onNegocioSelect).toHaveBeenCalledWith(1);
  });

  it('calls onTabChange when switching tabs', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(<LoginView {...baseProps} onTabChange={onTabChange} />);
    await user.click(screen.getByText('Registrarse'));
    expect(onTabChange).toHaveBeenCalledWith('register');
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginView {...baseProps} onSubmit={onSubmit} email="test@test.com" password="pass" />);
    const submitBtn = screen.getAllByRole('button', { name: /iniciar sesion/i })[1];
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner', () => {
    render(<LoginView {...baseProps} loading={true} />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<LoginView {...baseProps} showPassword={false} onShowPasswordToggle={onToggle} />);
    await user.click(screen.getByLabelText('Mostrar contrasena'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
