import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { ConfiguracionBotView } from '../components/ConfiguracionBotView';
import type { ConfigData, Tab, Servicio, HorarioNegocio } from '../types';

export const ConfiguracionBotContainer = () => {
  const [tab, setTab] = useState<Tab>('asistente');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query Configuracion General
  const { data: config, isLoading: loadingConfig } = useQuery<ConfigData>({
    queryKey: ['configuracion'],
    queryFn: api.getConfiguracion,
  });

  // Query Servicios
  const { data: serviciosData, isLoading: loadingServicios } = useQuery<Servicio[]>({
    queryKey: ['servicios'],
    queryFn: api.getServicios,
  });

  // Query Horarios
  const { data: horariosData, isLoading: loadingHorarios } = useQuery<HorarioNegocio[]>({
    queryKey: ['horarios'],
    queryFn: api.getHorariosNegocio,
  });

  const isLoading = loadingConfig || loadingServicios || loadingHorarios;

  // General tab state
  const [trigger, setTrigger] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [cobrarAdelanto, setCobrarAdelanto] = useState(true);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50);
  const [initialized, setInitialized] = useState(false);

  if (config && !initialized) {
    setTrigger(config.trigger);
    setMensajeBienvenida(config.mensajeBienvenida);
    setMensajeConfirmacion(config.mensajeConfirmacion);
    setCobrarAdelanto(config.cobrarAdelanto);
    setPorcentajeAdelanto(config.porcentajeAdelanto);
    setInitialized(true);
  }

  // --- GENERAL MUTATION ---
  const saveGeneralMutation = useMutation({
    mutationFn: () => {
      return api.updateConfiguracion({
        trigger,
        mensajeBienvenida,
        mensajeConfirmacion,
        cobrarAdelanto,
        porcentajeAdelanto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
    },
    onError: (e: Error) => {
      setError(e.message || 'Error guardando configuración general');
    },
  });

  // --- SERVICIOS MUTATIONS ---
  const addServicioMutation = useMutation({
    mutationFn: (data: { nombre: string; duracionMinutos: number; bufferMinutos: number; precio: number }) => api.createServicio(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const updateServicioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Servicio> }) => api.updateServicio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  const deleteServicioMutation = useMutation({
    mutationFn: (id: number) => api.deleteServicio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicios'] }),
  });

  // --- HORARIOS MUTATION ---
  const saveHorariosMutation = useMutation({
    mutationFn: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => api.updateHorariosNegocio(horarios),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
    onError: (e: Error) => setError(e.message || 'Error guardando horarios'),
  });

  const handleSaveGeneral = () => {
    setError(null);
    saveGeneralMutation.mutate();
  };

  const isPending = saveGeneralMutation.isPending || addServicioMutation.isPending || updateServicioMutation.isPending || deleteServicioMutation.isPending || saveHorariosMutation.isPending;

  return (
    <ConfiguracionBotView
      tab={tab}
      onTabChange={setTab}
      loading={isLoading}
      error={error}
      trigger={trigger}
      onTriggerChange={setTrigger}
      mensajeBienvenida={mensajeBienvenida}
      onMensajeBienvenidaChange={setMensajeBienvenida}
      mensajeConfirmacion={mensajeConfirmacion}
      onMensajeConfirmacionChange={setMensajeConfirmacion}
      cobrarAdelanto={cobrarAdelanto}
      onCobrarAdelantoChange={setCobrarAdelanto}
      porcentajeAdelanto={porcentajeAdelanto}
      onPorcentajeAdelantoChange={setPorcentajeAdelanto}
      onSaveGeneral={handleSaveGeneral}
      isGeneralPending={saveGeneralMutation.isPending}
      isGeneralSuccess={saveGeneralMutation.isSuccess}
      
      // Servicios
      servicios={serviciosData || []}
      onAddServicio={(data) => addServicioMutation.mutate(data)}
      onUpdateServicio={(id, data) => updateServicioMutation.mutate({ id, data })}
      onDeleteServicio={(id) => deleteServicioMutation.mutate(id)}
      
      // Horarios
      horarios={horariosData || []}
      onSaveHorarios={(horarios) => saveHorariosMutation.mutate(horarios)}
      isHorariosSaving={saveHorariosMutation.isPending}

      isPendingAny={isPending}
    />
  );
};
