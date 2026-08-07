import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { citasApi } from './citas.api';

export function useReprogramarCitaMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  { citaId: string; fecha: string; horario: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, fecha, horario }: { citaId: string; fecha: string; horario: string }) =>
      citasApi.reprogramarCita(citaId, fecha, horario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
