import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { citasApi } from './citas.api';

export function useMarkNoShowMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (citaId: string) => citasApi.marcarNoAsistio(citaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}

export function useMarkAsistioMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (citaId: string) => citasApi.marcarAsistio(citaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
