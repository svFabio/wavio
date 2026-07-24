import { apiClient } from '../../../lib/apiClient';
import type { Cliente } from '../../../types';

export const clientesApi = {
  getClientes: async (): Promise<Cliente[]> => {
    const res = await apiClient.get<{
      data: Cliente[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>('/clientes');
    return res.data;
  },

  getClienteNoShows: async (id: number): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>(`/clientes/${id}/no-shows`);
  },
};
