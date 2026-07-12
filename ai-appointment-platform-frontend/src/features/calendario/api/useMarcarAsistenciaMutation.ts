import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useMarcarAsistencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ citaId, noAsistio }: { citaId: string; noAsistio: boolean }) =>
      noAsistio ? api.marcarNoAsistio(citaId) : api.marcarAsistio(citaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
