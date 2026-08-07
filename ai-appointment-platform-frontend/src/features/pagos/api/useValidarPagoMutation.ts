import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import { citasApi } from '../../calendario/api/citas.api';

export const useValidarPagoMutation = (): UseMutationResult<
  void,
  Error,
  { id: string; accion: 'APROBAR' | 'RECHAZAR' }
> => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  return useMutation({
    mutationFn: async ({ id, accion }: { id: string; accion: 'APROBAR' | 'RECHAZAR' }) => {
      const success = await citasApi.validarPago(id, accion);
      if (!success) throw new Error('Error al realizar la acción');
    },
    onSuccess: () => {
      showNotification('Acción realizada con éxito', 'success');
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
    onError: () => {
      showNotification('Error de conexión', 'error');
    },
  });
};
