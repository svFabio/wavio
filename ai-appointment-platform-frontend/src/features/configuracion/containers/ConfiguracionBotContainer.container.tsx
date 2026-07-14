import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { ConfiguracionBotView } from '../components/ConfiguracionBotView';
import type { ConfigData, Horarios, Servicio, Tab } from '../types';
import { DIAS, makeServicio } from '../types';

export const ConfiguracionBotContainer = () => {
  const [tab, setTab] = useState<Tab>('general');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: config, isLoading: loading } = useQuery<ConfigData>({
    queryKey: ['configuracion'],
    queryFn: async () => {
      const raw = await api.getConfiguracion();
      return {
        ...raw,
        servicios: raw.servicios.map((s, i) => ({ ...s, _key: i })),
      };
    },
  });

  const [trigger, setTrigger] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cobrarAdelanto, setCobrarAdelanto] = useState(true);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50);
  const [horariosTexto, setHorariosTexto] = useState<Record<string, string>>({
    lunes: '',
    martes: '',
    miercoles: '',
    jueves: '',
    viernes: '',
    sabado: '',
    domingo: '',
  });
  const [initialized, setInitialized] = useState(false);

  if (config && !initialized) {
    setTrigger(config.trigger);
    setMensajeBienvenida(config.mensajeBienvenida);
    setMensajeConfirmacion(config.mensajeConfirmacion);
    setServicios(Array.isArray(config.servicios) ? config.servicios : []);
    setCobrarAdelanto(config.cobrarAdelanto);
    setPorcentajeAdelanto(config.porcentajeAdelanto);
    const texto: Record<string, string> = {};
    DIAS.forEach((d) => {
      texto[d] = ((config.horarios as Horarios)[d] ?? []).join(', ');
    });
    setHorariosTexto(texto);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const horarios: Horarios = {};
      DIAS.forEach((dia) => {
        horarios[dia] = (horariosTexto[dia] || '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => /^\d{1,2}:\d{2}$/.test(s));
      });
      return api.updateConfiguracion({
        trigger,
        mensajeBienvenida,
        mensajeConfirmacion,
        servicios,
        horarios,
        cobrarAdelanto,
        porcentajeAdelanto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
    },
    onError: (e: Error) => {
      setError(e.message || 'Error guardando');
    },
  });

  const addServicio = () => setServicios((s) => [...s, makeServicio()]);
  const removeServicio = (key: number) => setServicios((s) => s.filter((svc) => svc._key !== key));
  const updateServicio = (key: number, field: 'nombre' | 'precio', value: string | number) =>
    setServicios((s) => s.map((svc) => (svc._key === key ? { ...svc, [field]: value } : svc)));

  const handleSave = () => {
    setError(null);
    saveMutation.mutate();
  };

  return (
    <ConfiguracionBotView
      tab={tab}
      onTabChange={setTab}
      loading={loading}
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
      servicios={servicios}
      onAddServicio={addServicio}
      onRemoveServicio={removeServicio}
      onUpdateServicio={updateServicio}
      horariosTexto={horariosTexto}
      onHorariosChange={setHorariosTexto}
      onSave={handleSave}
      isPending={saveMutation.isPending}
      isSuccess={saveMutation.isSuccess}
    />
  );
};
