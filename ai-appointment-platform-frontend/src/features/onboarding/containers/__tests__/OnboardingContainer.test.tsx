import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { OnboardingContainer } from '../OnboardingContainer.container';
import { configuracionApi } from '../../../configuracion/api/configuracion.api';

vi.mock('../../../configuracion/api/configuracion.api', () => ({
  configuracionApi: {
    configurarNegocio: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('OnboardingContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders onboarding view', () => {
    renderWithProviders(<OnboardingContainer />);
    expect(screen.getByText('Bienvenido!')).toBeInTheDocument();
  });

  it('shows error for short name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingContainer />);
    await user.type(screen.getByPlaceholderText('Ej: Samsara Spa, Barberia El Punto...'), 'A');
    await user.click(screen.getByText('Comenzar'));
    expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeInTheDocument();
  });

  it('calls configurarNegocio on submit', async () => {
    vi.mocked(configuracionApi.configurarNegocio).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderWithProviders(<OnboardingContainer />);
    const input = screen.getByPlaceholderText('Ej: Samsara Spa, Barberia El Punto...');
    await user.type(input, 'Mi Nuevo Spa');
    await user.click(screen.getByText('Comenzar'));
    await vi.waitFor(() => {
      expect(configuracionApi.configurarNegocio).toHaveBeenCalledWith('Mi Nuevo Spa');
    });
  });
});
