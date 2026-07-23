import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useNotifications } from '../../../shared/hooks/useNotifications';

export const useValidarPagoMutation = (): UseMutationResult<
  void,
  Error,
  { id: string; accion: 'APROBAR' | 'RECHAZAR' }
> => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: ({ id, accion }: { id: string; accion: 'APROBAR' | 'RECHAZAR' }) =>
      api.validarPago(id, accion).then((success) => {
        if (!success) throw new Error('Error al realizar la acción');
      }),
    onSuccess: () => {
      showNotification('Acción realizada con éxito', 'success');
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
    onError: () => {
      showNotification('Error de conexión', 'error');
    },
  });
};
