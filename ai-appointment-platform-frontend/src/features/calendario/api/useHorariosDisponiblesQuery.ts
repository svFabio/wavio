import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useHorariosDisponiblesQuery(
  fecha: string,
  enabled: boolean,
  servicioId?: number,
): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: ['horarios', fecha, servicioId],
    queryFn: () => api.obtenerHorariosDisponibles(fecha, servicioId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
