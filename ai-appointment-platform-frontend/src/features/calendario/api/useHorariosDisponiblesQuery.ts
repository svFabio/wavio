import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { citasApi } from './citas.api';

export function useHorariosDisponiblesQuery(
  fecha: string,
  enabled: boolean,
  servicioId?: number,
): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: ['horarios', fecha, servicioId],
    queryFn: () => citasApi.obtenerHorariosDisponibles(fecha, servicioId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
