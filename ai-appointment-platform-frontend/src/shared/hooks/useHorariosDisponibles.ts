import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export function useHorariosDisponibles(fecha: string, enabled: boolean) {
  return useQuery({
    queryKey: ['horarios', fecha],
    queryFn: () => api.obtenerHorariosDisponibles(fecha),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
