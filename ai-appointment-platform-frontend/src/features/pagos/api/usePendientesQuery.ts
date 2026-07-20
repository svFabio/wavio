import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Cita } from '../../../types';
import { api } from '../../../services/api';

export const usePendientesQuery = (): UseQueryResult<Cita[], Error> => {
  return useQuery({
    queryKey: ['citas', 'pendientes'],
    queryFn: () => api.obtenerPendientes(),
  });
};
