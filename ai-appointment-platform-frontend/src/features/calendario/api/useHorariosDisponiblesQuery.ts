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
    // Nunca pedir con fecha vacía: el backend responde 400 de validación y
    // solo ensucia el Network (la fecha se borra al tipear en el datepicker).
    enabled: enabled && Boolean(fecha),
    staleTime: 5 * 60 * 1000,
  });
}
