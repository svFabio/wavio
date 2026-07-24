import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useMarcarAsistenciaMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  { citaId: string; noAsistio: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, noAsistio }: { citaId: string; noAsistio: boolean }) =>
      noAsistio ? api.marcarNoAsistio(citaId) : api.marcarAsistio(citaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
