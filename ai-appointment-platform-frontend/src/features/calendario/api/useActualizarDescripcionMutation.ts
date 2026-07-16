import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useActualizarDescripcionMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  { citaId: string; descripcion: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, descripcion }: { citaId: string; descripcion: string }) =>
      api.actualizarDescripcion(citaId, descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
