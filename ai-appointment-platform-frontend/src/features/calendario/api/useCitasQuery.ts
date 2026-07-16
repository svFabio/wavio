import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Cita } from '../../types';
import { api } from '../../services/api';

export const useCitasQuery = (fecha?: string): UseQueryResult<Cita[], Error> => {
  return useQuery({
    queryKey: ['citas', fecha],
    queryFn: () => api.obtenerCitas(fecha),
  });
};
