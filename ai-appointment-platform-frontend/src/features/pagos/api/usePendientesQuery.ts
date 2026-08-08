import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Cita } from '../../../types';
import { citasApi } from '../../calendario/api/citas.api';

export const usePendientesQuery = (): UseQueryResult<Cita[], Error> => {
  return useQuery({
    queryKey: ['citas', 'pendientes'],
    queryFn: () => citasApi.obtenerPendientes(),
  });
};
