import { apiClient } from '../../../lib/apiClient';

export const statisticsApi = {
  getStatisticsOverview: async (): Promise<{
    citasMes: number;
    ingresosMes: number;
    topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
    horariosPopulares: Array<{ horario: string; totalReservas: number }>;
    citasVirtuales: number;
    citasPresenciales: number;
    ratingPromedio?: number;
  }> => {
    return apiClient.get<{
      citasMes: number;
      ingresosMes: number;
      topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
      horariosPopulares: Array<{ horario: string; totalReservas: number }>;
      citasVirtuales: number;
      citasPresenciales: number;
      ratingPromedio?: number;
    }>('/statistics/overview');
  },

  getStatisticsRevenue: async (
    months = 6,
  ): Promise<{ revenue: Array<{ mes: string; total: number }> }> => {
    return apiClient.get<{ revenue: Array<{ mes: string; total: number }> }>(
      `/statistics/revenue?months=${months}`,
    );
  },
};
