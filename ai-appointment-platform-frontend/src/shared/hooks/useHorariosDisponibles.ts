import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export function useHorariosDisponibles(fecha: string, enabled: boolean, servicioId?: number) {
  return useQuery({
    queryKey: ['horarios', fecha, servicioId],
    queryFn: () => api.obtenerHorariosDisponibles(fecha, servicioId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
