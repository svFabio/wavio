import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Cita } from '../../types';
import { api } from '../../services/api';
import { toast } from 'sonner';

export const useCitas = (fecha?: string): UseQueryResult<Cita[], Error> => {
  return useQuery({
    queryKey: ['citas', fecha],
    queryFn: () => api.obtenerCitas(fecha),
  });
};

export const usePendientes = (): UseQueryResult<Cita[], Error> => {
  return useQuery({
    queryKey: ['citas', 'pendientes'],
    queryFn: () => api.obtenerPendientes(),
  });
};

export const useValidarPago = (): UseMutationResult<
  void,
  Error,
  { id: string; accion: 'APROBAR' | 'RECHAZAR' }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accion }: { id: string; accion: 'APROBAR' | 'RECHAZAR' }) =>
      api.validarPago(id, accion).then((success) => {
        if (!success) throw new Error('Error al realizar la acción');
      }),
    onSuccess: () => {
      toast.success('Acción realizada con éxito');
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
    onError: () => {
      toast.error('Error de conexión');
    },
  });
};
