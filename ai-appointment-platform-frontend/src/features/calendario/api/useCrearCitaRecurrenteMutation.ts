import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { citasApi } from './citas.api';

interface CrearCitaRecurrenteParams {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
  servicioId?: number;
  staffId?: number;
  recurrence: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  recurrenceEnd: string;
}

export function useCrearCitaRecurrenteMutation(): UseMutationResult<
  { success: boolean; instancesCreated?: number; error?: string },
  Error,
  CrearCitaRecurrenteParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrearCitaRecurrenteParams) => citasApi.crearCitaRecurrente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
