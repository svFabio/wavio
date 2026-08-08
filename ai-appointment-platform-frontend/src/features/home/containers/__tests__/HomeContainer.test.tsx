import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { HomeContainer } from '../HomeContainer.container';
import { citasApi } from '../../../calendario/api/citas.api';

vi.mock('../../../calendario/api/citas.api', () => ({
  citasApi: {
    obtenerResumen: vi.fn(),
    obtenerCitas: vi.fn(),
  },
}));

describe('HomeContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(citasApi.obtenerResumen).mockResolvedValue({
      totalHoy: 5,
      pendientes: 2,
      completadas: 10,
      ingresos: 3000,
    });
    vi.mocked(citasApi.obtenerCitas).mockResolvedValue([]);
  });

  it('renders home view with data', async () => {
    renderWithProviders(<HomeContainer />);
    expect(await screen.findByText('Citas para Hoy')).toBeInTheDocument();
    expect(await screen.findByText('5')).toBeInTheDocument();
  });
});
