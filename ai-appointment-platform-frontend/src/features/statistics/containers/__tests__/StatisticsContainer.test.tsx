import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { StatisticsContainer } from '../StatisticsContainer.container';
import { statisticsApi } from '../../api/statistics.api';
import { clientesApi } from '../../api/clientes.api';

vi.mock('../../api/statistics.api', () => ({
  statisticsApi: {
    getStatisticsOverview: vi.fn(),
    getStatisticsRevenue: vi.fn(),
  },
}));

vi.mock('../../api/clientes.api', () => ({
  clientesApi: {
    getClientes: vi.fn(),
  },
}));

describe('StatisticsContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(statisticsApi.getStatisticsOverview).mockResolvedValue({
      citasMes: 10,
      ingresosMes: 5000,
      citasVirtuales: 6,
      citasPresenciales: 4,
      topClientes: [],
      horariosPopulares: [],
    });
    vi.mocked(statisticsApi.getStatisticsRevenue).mockResolvedValue({ revenue: [] });
    vi.mocked(clientesApi.getClientes).mockResolvedValue([]);
  });

  it('renders statistics view', async () => {
    renderWithProviders(<StatisticsContainer />);
    expect(await screen.findByText('Estadisticas')).toBeInTheDocument();
  });
});
