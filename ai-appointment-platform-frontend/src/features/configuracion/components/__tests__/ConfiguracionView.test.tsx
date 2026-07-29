import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { ConfiguracionView } from '../ConfiguracionView';
import type { Servicio, HorarioNegocio, HorarioEspecial } from '../../types';

vi.mock('../../../../shared/hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({
    supported: true,
    pushEnabled: false,
    error: null,
    toggle: vi.fn(),
  }),
}));

const defaultProps = {
  ui: { loading: false, error: null, isPendingAny: false },
  serviciosHandlers: {
    servicios: [] as Servicio[],
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  },
  horariosHandlers: {
    horarios: [] as HorarioNegocio[],
    onSave: vi.fn(),
    isSaving: false,
  },
  horariosEspecialesHandlers: {
    horariosEspeciales: [] as HorarioEspecial[],
    onCreate: vi.fn(),
    onDelete: vi.fn(),
  },
};

describe('ConfiguracionView', () => {
  it('renders loading skeleton', () => {
    const { container } = renderWithProviders(
      <ConfiguracionView
        {...defaultProps}
        ui={{ loading: true, error: null, isPendingAny: false }}
      />,
    );
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders title and tabs', () => {
    renderWithProviders(<ConfiguracionView {...defaultProps} />);
    expect(screen.getByText('Configuracion')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('Horarios Regulares')).toBeInTheDocument();
    expect(screen.getByText('Fechas Especiales')).toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    renderWithProviders(
      <ConfiguracionView
        {...defaultProps}
        ui={{ loading: false, error: 'Something went wrong', isPendingAny: false }}
      />,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders ServiciosTab by default', () => {
    renderWithProviders(<ConfiguracionView {...defaultProps} />);
    expect(screen.getByText('No hay servicios configurados.')).toBeInTheDocument();
  });

  it('switches to HorariosTab when clicking Horarios Regulares', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfiguracionView {...defaultProps} />);
    await user.click(screen.getByText('Horarios Regulares'));
    expect(screen.getByText('Guardar Horarios')).toBeInTheDocument();
  });

  it('switches to HorariosEspecialesTab when clicking Fechas Especiales', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfiguracionView {...defaultProps} />);
    await user.click(screen.getByText('Fechas Especiales'));
    expect(screen.getByText('No hay fechas especiales configuradas')).toBeInTheDocument();
  });

  it('renders PushNotificationToggle', () => {
    renderWithProviders(<ConfiguracionView {...defaultProps} />);
    expect(screen.getByText('Notificaciones push')).toBeInTheDocument();
  });
});
