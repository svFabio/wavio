import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useActualizarDescripcionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, descripcion }: { citaId: string; descripcion: string }) =>
      api.actualizarDescripcion(citaId, descripcion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
