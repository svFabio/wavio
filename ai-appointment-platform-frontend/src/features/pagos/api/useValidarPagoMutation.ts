import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { citasApi } from '../../calendario/api/citas.api';

export const useValidarPagoMutation = (): UseMutationResult<
  void,
  Error,
  { id: string; accion: 'APROBAR' | 'RECHAZAR' }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, accion }: { id: string; accion: 'APROBAR' | 'RECHAZAR' }) => {
      const success = await citasApi.validarPago(id, accion);
      if (!success) throw new Error('Error al realizar la acción');
    },
    onSuccess: () => {
      // Sonner (montado en main.tsx): useNotifications no lo renderiza nadie.
      toast.success('Acción realizada con éxito');
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
    onError: () => {
      toast.error('Error de conexión');
    },
  });
};
