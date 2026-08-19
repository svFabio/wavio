import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AsistenteView } from '../components/AsistenteView';
import type { ConfigData } from '../types';
import type { ChatFlowStep } from '../types/domain';
import { configuracionApi } from '../api/configuracion.api';

export const AsistenteContainer = (): React.JSX.Element => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: config, isLoading: loadingConfig } = useQuery<ConfigData>({
    queryKey: ['configuracion'],
    queryFn: configuracionApi.getConfiguracion,
  });

  const [trigger, setTrigger] = useState(config?.trigger ?? '');
  const [mensajeBienvenida, setMensajeBienvenida] = useState(config?.mensajeBienvenida ?? '');
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState(config?.mensajeConfirmacion ?? '');
  const [cobrarAdelanto, setCobrarAdelanto] = useState(config?.cobrarAdelanto ?? true);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(config?.porcentajeAdelanto ?? 50);
  const [chatFlow, setChatFlow] = useState<ChatFlowStep[]>(config?.chatFlow ?? []);
  const [qrFotoUrl, setQrFotoUrl] = useState<string | null>(config?.qrFotoUrl ?? null);

  const saveMutation = useMutation({
    mutationFn: () =>
      configuracionApi.updateConfiguracion({
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
    mutationFn: (base64: string) => configuracionApi.uploadQR(base64),
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
      key={config?.updatedAt ? new Date(config.updatedAt).getTime() : 'initial'}
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
