import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useClientesQuery() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes(),
  });
}
