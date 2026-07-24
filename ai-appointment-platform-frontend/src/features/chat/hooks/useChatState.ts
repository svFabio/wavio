import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { chatApi } from '../api/chat.api';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import type { MensajeChat, Conversacion } from '../types';

export const formatJid = (jid: string): string => jid.split('@')[0];
export const formatTimestamp = (ts: string): string => {
  const date = new Date(ts);
  return isValid(date) ? format(date, 'HH:mm', { locale: es }) : '';
};
export const formatDate = (ts: string): string => {
  const date = new Date(ts);
  return isValid(date) ? format(date, 'dd MMM, HH:mm', { locale: es }) : '';
};

export const useChatState = (): {
  conversacionesQuery: ReturnType<typeof useQuery<Conversacion[], Error>>;
  mensajesQuery: ReturnType<typeof useQuery<MensajeChat[], Error>>;
  selectedJid: string | null;
  setSelectedJid: (jid: string | null) => void;
  nuevoMensaje: string;
  setNuevoMensaje: (msg: string) => void;
  busqueda: string;
  setBusqueda: (q: string) => void;
  enviando: boolean;
  setEnviando: (e: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  conversacionesFiltradas: Conversacion[];
  selectedConversacion: Conversacion | undefined;
  mensajes: MensajeChat[];
  loading: boolean;
  loadingMensajes: boolean;
} => {
  const queryClient = useQueryClient();
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedJidRef = useRef(selectedJid);

  useEffect(() => {
    selectedJidRef.current = selectedJid;
  }, [selectedJid]);

  const conversacionesQuery = useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => chatApi.obtenerConversaciones(),
  });

  const mensajesQuery = useQuery({
    queryKey: ['mensajes', selectedJid],
    queryFn: () => chatApi.obtenerMensajes(selectedJid!),
    enabled: !!selectedJid,
  });

  const loading = conversacionesQuery.isLoading;
  const mensajes = mensajesQuery.data ?? [];
  const loadingMensajes = mensajesQuery.isLoading;

  const handleNuevoMensaje = useCallback(
    (msg: MensajeChat) => {
      queryClient.setQueryData<Conversacion[]>(['conversaciones'], (old) => {
        if (!old) return old;
        const existente = old.find((c) => c.remoteJid === msg.remoteJid);
        if (existente) {
          return old
            .map((c) =>
              c.remoteJid === msg.remoteJid
                ? {
                    ...c,
                    ultimoContenido: msg.contenido,
                    ultimoMensaje: msg.timestamp,
                    ultimaDireccion: msg.direccion,
                    totalMensajes: c.totalMensajes + 1,
                  }
                : c,
            )
            .sort(
              (a, b) => new Date(b.ultimoMensaje).getTime() - new Date(a.ultimoMensaje).getTime(),
            );
        } else {
          return [
            {
              remoteJid: msg.remoteJid,
              ultimoMensaje: msg.timestamp,
              totalMensajes: 1,
              ultimoContenido: msg.contenido,
              ultimaDireccion: msg.direccion,
            },
            ...old,
          ];
        }
      });

      if (selectedJidRef.current === msg.remoteJid) {
        queryClient.setQueryData<MensajeChat[]>(['mensajes', selectedJidRef.current], (old) => {
          if (!old) return [msg];
          return [...old, msg];
        });
      }
    },
    [queryClient],
  );

  const handleConversacionEliminada = useCallback(
    ({ remoteJid }: { remoteJid: string }) => {
      queryClient.setQueryData<Conversacion[]>(['conversaciones'], (old) => {
        if (!old) return old;
        return old.filter((c) => c.remoteJid !== remoteJid);
      });
      if (selectedJidRef.current === remoteJid) {
        setSelectedJid(null);
      }
    },
    [queryClient],
  );

  useSocketEvent<MensajeChat>('nuevo-mensaje', handleNuevoMensaje);
  useSocketEvent<{ remoteJid: string }>('conversacion-eliminada', handleConversacionEliminada);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const conversacionesFiltradas = useMemo(() => {
    return (conversacionesQuery.data ?? []).filter(
      (c) =>
        formatJid(c.remoteJid).includes(busqueda) ||
        (c.clienteNombre ?? '').toLowerCase().includes(busqueda.toLowerCase()),
    );
  }, [conversacionesQuery.data, busqueda]);

  const selectedConversacion = useMemo(() => {
    return conversacionesQuery.data?.find((c) => c.remoteJid === selectedJid);
  }, [conversacionesQuery.data, selectedJid]);

  return {
    conversacionesQuery,
    mensajesQuery,
    selectedJid,
    setSelectedJid,
    nuevoMensaje,
    setNuevoMensaje,
    busqueda,
    setBusqueda,
    enviando,
    setEnviando,
    messagesEndRef,
    conversacionesFiltradas,
    selectedConversacion,
    mensajes,
    loading,
    loadingMensajes,
  };
};