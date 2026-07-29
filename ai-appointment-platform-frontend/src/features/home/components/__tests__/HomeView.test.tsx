import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeView } from '../HomeView';
import type { ResumenData } from '../../types';
import type { Cita } from '../../../calendario/types';
import { vi } from 'vitest';

const data: ResumenData = {
  totalHoy: 5,
  pendientes: 2,
  completadas: 10,
  ingresos: 3000,
};

describe('HomeView', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeView data={null} loading={true} citas={[]} />
      </MemoryRouter>,
    );
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders welcome and stat cards', () => {
    render(
      <MemoryRouter>
        <HomeView data={data} loading={false} citas={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Citas para Hoy')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Pagos por Validar')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <MemoryRouter>
        <HomeView
          data={data}
          loading={false}
          citas={[]}
          error="Error cargando el resumen del día"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Error cargando el resumen del día')).toBeInTheDocument();
  });
});
