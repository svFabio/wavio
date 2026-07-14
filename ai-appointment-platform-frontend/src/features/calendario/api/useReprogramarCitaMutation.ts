import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useReprogramarCitaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, fecha, horario }: { citaId: string; fecha: string; horario: string }) =>
      api.reprogramarCita(citaId, fecha, horario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
