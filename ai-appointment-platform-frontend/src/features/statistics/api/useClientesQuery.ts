import { useQuery } from '@tanstack/react-query';
import { clientesApi } from './clientes.api';

export function useClientesQuery() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.getClientes(),
  });
}
