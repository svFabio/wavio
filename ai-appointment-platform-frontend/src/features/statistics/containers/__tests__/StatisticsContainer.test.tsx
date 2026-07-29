import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { StatisticsContainer } from '../StatisticsContainer.container';

vi.mock('../../../../lib/api', () => ({
  api: {
    getStatisticsOverview: vi.fn(),
    getStatisticsRevenue: vi.fn(),
    getClientes: vi.fn(),
  },
}));

import { api } from '../../../../lib/api';

describe('StatisticsContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getStatisticsOverview).mockResolvedValue({
      citasMes: 10,
      ingresosMes: 5000,
      citasVirtuales: 6,
      citasPresenciales: 4,
      topClientes: [],
      horariosPopulares: [],
    });
    vi.mocked(api.getStatisticsRevenue).mockResolvedValue({ revenue: [] });
    vi.mocked(api.getClientes).mockResolvedValue([]);
  });

  it('renders statistics view', async () => {
    renderWithProviders(<StatisticsContainer />);
    expect(await screen.findByText('Estadisticas')).toBeInTheDocument();
  });
});
