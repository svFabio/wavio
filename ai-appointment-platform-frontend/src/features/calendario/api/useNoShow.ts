import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useMarkNoShowMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (citaId: string) => api.marcarNoAsistio(citaId),
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
    mutationFn: (citaId: string) => api.marcarAsistio(citaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
