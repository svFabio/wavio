import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ConfiguracionView } from '../components/ConfiguracionView';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import type { Servicio, HorarioNegocio, HorarioEspecial } from '../types';

export const ConfiguracionContainer = () => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: serviciosData,
    isLoading: loadingServicios,
    isError: isErrorServicios,
  } = useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: api.getServicios,
  });

  const {
    data: horariosData,
    isLoading: loadingHorarios,
    isError: isErrorHorarios,
  } = useQuery<HorarioNegocio[]>({
    queryKey: ['horarios'],
    queryFn: api.getHorariosNegocio,
  });

  const {
    data: horariosEspecialesData,
    isLoading: loadingHorariosEspeciales,
    isError: isErrorHorariosEspeciales,
  } = useQuery<HorarioEspecial[]>({
    queryKey: ['horariosEspeciales'],
    queryFn: api.getHorariosEspeciales,
  });

  const isLoading = loadingServicios || loadingHorarios || loadingHorariosEspeciales;
  const queryError =
    isErrorServicios || isErrorHorarios || isErrorHorariosEspeciales
      ? 'Error cargando la configuración'
      : null;

  const addServicioMutation = useMutation({
    mutationFn: (data: {
      nombre: string;
      categoria?: string;
      duracionMinutos: number;
      bufferMinutos: number;
      precio: number;
    }) => api.createServicio(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
    onError: (e: Error) => setError(e.message || 'Error agregando servicio'),
  });

  const updateServicioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Servicio> }) =>
      api.updateServicio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
    onError: (e: Error) => setError(e.message || 'Error actualizando servicio'),
  });

  const deleteServicioMutation = useMutation({
    mutationFn: (id: number) => api.deleteServicio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
    onError: (e: Error) => setError(e.message || 'Error eliminando servicio'),
  });

  const saveHorariosMutation = useMutation({
    mutationFn: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) =>
      api.updateHorariosNegocio(horarios),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
    onError: (e: Error) => setError(e.message || 'Error guardando horarios'),
  });

  const createHorarioEspecialMutation = useMutation({
    mutationFn: (data: {
      fecha: string;
      cerrado: boolean;
      horaInicio: string | null;
      horaFin: string | null;
    }) => api.createHorarioEspecial(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horariosEspeciales'] }),
    onError: (e: Error) => setError(e.message || 'Error creando horario especial'),
  });

  const deleteHorarioEspecialMutation = useMutation({
    mutationFn: (id: number) => api.deleteHorarioEspecial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horariosEspeciales'] }),
    onError: (e: Error) => setError(e.message || 'Error eliminando horario especial'),
  });

  const isPending =
    addServicioMutation.isPending ||
    updateServicioMutation.isPending ||
    deleteServicioMutation.isPending ||
    saveHorariosMutation.isPending ||
    createHorarioEspecialMutation.isPending ||
    deleteHorarioEspecialMutation.isPending;

  const displayError = error || queryError;

  return (
    <ErrorBoundary>
      <ConfiguracionView
        ui={{
          loading: isLoading,
          error: displayError,
          isPendingAny: isPending,
        }}
        serviciosHandlers={{
          servicios: serviciosData || [],
          onAdd: (data) => addServicioMutation.mutate(data),
          onUpdate: (id, data) => updateServicioMutation.mutate({ id, data }),
          onDelete: (id) => deleteServicioMutation.mutate(id),
        }}
        horariosHandlers={{
          horarios: horariosData || [],
          onSave: (horarios) => saveHorariosMutation.mutate(horarios),
          isSaving: saveHorariosMutation.isPending,
        }}
        horariosEspecialesHandlers={{
          horariosEspeciales: horariosEspecialesData || [],
          onCreate: (data) => createHorarioEspecialMutation.mutate(data),
          onDelete: (id) => deleteHorarioEspecialMutation.mutate(id),
        }}
      />
    </ErrorBoundary>
  );
};
