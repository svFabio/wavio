import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statisticsApi } from '../statistics.api';

vi.mock('../../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../../../lib/apiClient';

const mockGet = vi.mocked(apiClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('statisticsApi.getStatisticsOverview', () => {
  it('calls GET /statistics/overview', async () => {
    const overviewData = {
      citasMes: 10,
      ingresosMes: 5000,
      topClientes: [],
      horariosPopulares: [],
      citasVirtuales: 6,
      citasPresenciales: 4,
    };
    mockGet.mockResolvedValue(overviewData);
    const result = await statisticsApi.getStatisticsOverview();
    expect(mockGet).toHaveBeenCalledWith('/statistics/overview');
    expect(result).toEqual(overviewData);
  });
});

describe('statisticsApi.getStatisticsRevenue', () => {
  it('calls GET /statistics/revenue with default months', async () => {
    mockGet.mockResolvedValue({ revenue: [] });
    await statisticsApi.getStatisticsRevenue();
    expect(mockGet).toHaveBeenCalledWith('/statistics/revenue?months=6');
  });

  it('calls GET /statistics/revenue with custom months', async () => {
    mockGet.mockResolvedValue({ revenue: [] });
    await statisticsApi.getStatisticsRevenue(12);
    expect(mockGet).toHaveBeenCalledWith('/statistics/revenue?months=12');
  });

  it('returns revenue data', async () => {
    const revenueData = {
      revenue: [
        { mes: '2026-01', total: 1000 },
        { mes: '2026-02', total: 2000 },
      ],
    };
    mockGet.mockResolvedValue(revenueData);
    const result = await statisticsApi.getStatisticsRevenue(2);
    expect(result).toEqual(revenueData);
  });
});
