import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { api } from '../../../services/api';

interface CrearCitaParams {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
  servicioId?: number;
}

export function useCrearCitaMutation(): UseMutationResult<
  { success: boolean; error?: string },
  Error,
  CrearCitaParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrearCitaParams) => api.crearCitaAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
