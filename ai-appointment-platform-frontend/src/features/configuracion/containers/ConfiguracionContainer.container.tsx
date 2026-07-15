import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { ConfiguracionView } from '../components/ConfiguracionView';
import type { Servicio, HorarioNegocio } from '../types';

export const ConfiguracionContainer = () => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: serviciosData, isLoading: loadingServicios } = useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: api.getServicios,
  });

  const { data: horariosData, isLoading: loadingHorarios } = useQuery<HorarioNegocio[]>({
    queryKey: ['horarios'],
    queryFn: api.getHorariosNegocio,
  });

  const isLoading = loadingServicios || loadingHorarios;

  const addServicioMutation = useMutation({
    mutationFn: (data: {
      nombre: string;
      duracionMinutos: number;
      bufferMinutos: number;
      precio: number;
    }) => api.createServicio(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const updateServicioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Servicio> }) =>
      api.updateServicio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const deleteServicioMutation = useMutation({
    mutationFn: (id: number) => api.deleteServicio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const saveHorariosMutation = useMutation({
    mutationFn: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) =>
      api.updateHorariosNegocio(horarios),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
    onError: (e: Error) => setError(e.message || 'Error guardando horarios'),
  });

  const isPending =
    addServicioMutation.isPending ||
    updateServicioMutation.isPending ||
    deleteServicioMutation.isPending ||
    saveHorariosMutation.isPending;

  return (
    <ConfiguracionView
      loading={isLoading}
      error={error}
      servicios={serviciosData || []}
      onAddServicio={(data) => addServicioMutation.mutate(data)}
      onUpdateServicio={(id, data) => updateServicioMutation.mutate({ id, data })}
      onDeleteServicio={(id) => deleteServicioMutation.mutate(id)}
      horarios={horariosData || []}
      onSaveHorarios={(horarios) => saveHorariosMutation.mutate(horarios)}
      isHorariosSaving={saveHorariosMutation.isPending}
      isPendingAny={isPending}
    />
  );
};
