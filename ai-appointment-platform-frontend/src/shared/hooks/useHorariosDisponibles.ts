import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { HorarioSlot } from '../../types';
import { api } from '../../services/api';

export function useHorariosDisponibles(
  fecha: string,
  enabled: boolean,
  servicioId?: number,
): UseQueryResult<HorarioSlot[], Error> {
  return useQuery({
    queryKey: ['horarios', fecha, servicioId],
    queryFn: () => api.obtenerHorariosDisponibles(fecha, servicioId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
