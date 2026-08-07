import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { citasApi } from './citas.api';

export function useCancelarSerieMutation(): UseMutationResult<
  { success: boolean; canceladas?: number; error?: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serieId: string) => citasApi.cancelarSerie(serieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
