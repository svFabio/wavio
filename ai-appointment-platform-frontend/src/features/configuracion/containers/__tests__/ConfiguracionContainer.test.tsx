import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { renderWithProviders } from '../../../../test-utils';
import { ConfiguracionContainer } from '../ConfiguracionContainer.container';

const mockServicios = [
  {
    id: 1,
    nombre: 'Masaje',
    categoria: 'Masajes',
    duracionMinutos: 60,
    bufferMinutos: 10,
    precio: 150,
    activo: true,
  },
];

const mockHorarios = [{ id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', activo: true }];

const mockHorariosEspeciales = [
  { id: 1, fecha: '2026-12-25', cerrado: true, horaInicio: null, horaFin: null },
];

beforeEach(() => {
  server.use(
    http.get('*/api/v1/servicios', () => HttpResponse.json(mockServicios)),
    http.get('*/api/v1/horarios', () => HttpResponse.json(mockHorarios)),
    http.get('*/api/v1/horarios/especiales', () => HttpResponse.json(mockHorariosEspeciales)),
    http.post('*/api/v1/servicios', () =>
      HttpResponse.json({
        id: 3,
        nombre: 'New',
        duracionMinutos: 30,
        bufferMinutos: 5,
        precio: 100,
        activo: true,
      }),
    ),
    http.patch('*/api/v1/servicios/:id', () => HttpResponse.json({ id: 1, activo: false })),
    http.delete('*/api/v1/servicios/:id', () => HttpResponse.json({})),
    http.put('*/api/v1/horarios', () => HttpResponse.json({})),
    http.post('*/api/v1/horarios/especiales', () =>
      HttpResponse.json({
        id: 2,
        fecha: '2026-12-31',
        cerrado: true,
        horaInicio: null,
        horaFin: null,
      }),
    ),
    http.delete('*/api/v1/horarios/especiales/:id', () => HttpResponse.json({})),
  );
});

describe('ConfiguracionContainer', () => {
  it('renders loading state', () => {
    server.use(http.get('*/api/v1/servicios', () => new Promise(() => {})));
    const { container } = renderWithProviders(<ConfiguracionContainer />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders servicios after loading', async () => {
    renderWithProviders(<ConfiguracionContainer />);
    await waitFor(() => {
      expect(screen.getByText('Masaje')).toBeInTheDocument();
    });
  });

  it('shows horarios tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfiguracionContainer />);
    await waitFor(() => {
      expect(screen.getByText('Masaje')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Horarios Regulares'));
    await waitFor(() => {
      expect(screen.getByText('Guardar Horarios')).toBeInTheDocument();
    });
  });

  it('shows horarios especiales tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfiguracionContainer />);
    await waitFor(() => {
      expect(screen.getByText('Masaje')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Fechas Especiales'));
    await waitFor(() => {
      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });
  });

  it('shows error when query fails', async () => {
    server.use(http.get('*/api/v1/servicios', () => HttpResponse.error()));
    renderWithProviders(<ConfiguracionContainer />);
    await waitFor(() => {
      expect(screen.getByText('Error cargando la configuración')).toBeInTheDocument();
    });
  });
});
