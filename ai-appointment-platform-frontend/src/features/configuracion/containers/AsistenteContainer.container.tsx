import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { AsistenteView } from '../components/AsistenteView';
import type { ConfigData } from '../types';
import type { ChatFlowStep } from '../components/ChatFlowEditor';

export const AsistenteContainer = () => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: config, isLoading: loadingConfig } = useQuery<ConfigData>({
    queryKey: ['configuracion'],
    queryFn: api.getConfiguracion,
  });

  const [trigger, setTrigger] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [cobrarAdelanto, setCobrarAdelanto] = useState(true);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50);
  const [chatFlow, setChatFlow] = useState<ChatFlowStep[]>([]);
  const [qrFotoUrl, setQrFotoUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (config && !initialized) {
    setTrigger(config.trigger);
    setMensajeBienvenida(config.mensajeBienvenida);
    setMensajeConfirmacion(config.mensajeConfirmacion);
    setCobrarAdelanto(config.cobrarAdelanto);
    setPorcentajeAdelanto(config.porcentajeAdelanto);
    setChatFlow(config.chatFlow || []);
    setQrFotoUrl(config.qrFotoUrl || null);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateConfiguracion({
        trigger,
        mensajeBienvenida,
        mensajeConfirmacion,
        cobrarAdelanto,
        porcentajeAdelanto,
        chatFlow,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
    },
    onError: (e: Error) => {
      setError(e.message || 'Error guardando configuracion');
    },
  });

  const uploadQRMutation = useMutation({
    mutationFn: (base64: string) => api.uploadQR(base64),
    onSuccess: (data) => {
      setQrFotoUrl(data.qrFotoUrl);
      queryClient.invalidateQueries({ queryKey: ['configuracion'] });
    },
    onError: (e: Error) => {
      setError(e.message || 'Error subiendo imagen QR');
    },
  });

  const handleSave = () => {
    setError(null);
    saveMutation.mutate();
  };

  const handleUploadQR = (base64: string) => {
    uploadQRMutation.mutate(base64);
  };

  const handleRemoveQR = () => {
    setQrFotoUrl(null);
  };

  return (
    <AsistenteView
      loading={loadingConfig}
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
      onSave={handleSave}
      isPending={saveMutation.isPending}
      isSuccess={saveMutation.isSuccess}
      chatFlow={chatFlow}
      onChangeChatFlow={setChatFlow}
      qrFotoUrl={qrFotoUrl}
      onUploadQR={handleUploadQR}
      onRemoveQR={handleRemoveQR}
      isUploadingQR={uploadQRMutation.isPending}
    />
  );
};
