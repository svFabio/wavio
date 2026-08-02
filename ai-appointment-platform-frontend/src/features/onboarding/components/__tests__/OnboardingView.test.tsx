import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { OnboardingView } from '../OnboardingView';

describe('OnboardingView', () => {
  it('renders welcome message', () => {
    render(
      <OnboardingView
        nombre=""
        onNombreChange={vi.fn()}
        error={null}
        loading={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Bienvenido!')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Ej: Samsara Spa, Barberia El Punto...'),
    ).toBeInTheDocument();
  });

  it('calls onNombreChange when typing', async () => {
    const onNombreChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OnboardingView
        nombre=""
        onNombreChange={onNombreChange}
        error={null}
        loading={false}
        onSubmit={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText('Ej: Samsara Spa, Barberia El Punto...'), 'Mi Spa');
    expect(onNombreChange).toHaveBeenCalledTimes(6);
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <OnboardingView
        nombre="Mi Spa"
        onNombreChange={vi.fn()}
        error={null}
        loading={false}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByText('Comenzar'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows error message', () => {
    render(
      <OnboardingView
        nombre=""
        onNombreChange={vi.fn()}
        error="Error al configurar el negocio"
        loading={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Error al configurar el negocio')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(
      <OnboardingView
        nombre="Mi Spa"
        onNombreChange={vi.fn()}
        error={null}
        loading={true}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });
});
