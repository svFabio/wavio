import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useClientesQuery() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes(),
  });
}
