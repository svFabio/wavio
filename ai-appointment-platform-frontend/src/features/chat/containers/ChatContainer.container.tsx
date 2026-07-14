import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import type { MensajeChat, Conversacion } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatView } from '../components/ChatView';

const formatJid = (jid: string) => jid.split('@')[0];
const formatTimestamp = (ts: string) => {
  try {
    return format(new Date(ts), 'HH:mm', { locale: es });
  } catch {
    return '';
  }
};
const formatDate = (ts: string) => {
  try {
    return format(new Date(ts), 'dd MMM, HH:mm', { locale: es });
  } catch {
    return '';
  }
};

export const ChatContainer = () => {
  const queryClient = useQueryClient();
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedJidRef = useRef(selectedJid);
  selectedJidRef.current = selectedJid;

  const conversacionesQuery = useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => api.obtenerConversaciones(),
  });

  const mensajesQuery = useQuery({
    queryKey: ['mensajes', selectedJid],
    queryFn: () => api.obtenerMensajes(selectedJid!),
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

  const abrirConversacion = (jid: string) => {
    setSelectedJid(jid);
    setNuevoMensaje('');
  };

  const enviarMensaje = async () => {
    if (!selectedJid || !nuevoMensaje.trim() || enviando) return;
    setEnviando(true);
    try {
      const result = await api.enviarMensajeChat(selectedJid, nuevoMensaje.trim());
      if (result.success) {
        setNuevoMensaje('');
      }
    } catch {
      // Error silenciado — el usuario puede reintentar
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteConversacion = async (e: React.MouseEvent, jid: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación y todos sus mensajes de la base de datos?')) return;
    try {
      const result = await api.eliminarConversacion(jid);
      if (result.success) {
        queryClient.setQueryData<Conversacion[]>(['conversaciones'], (old) => {
          if (!old) return old;
          return old.filter((c) => c.remoteJid !== jid);
        });
        if (selectedJid === jid) setSelectedJid(null);
      }
    } catch {
      // Error silenciado — el usuario puede reintentar
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

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

  const onVolver = () => setSelectedJid(null);

  return (
    <ChatView
      conversacionesFiltradas={conversacionesFiltradas}
      selectedJid={selectedJid}
      loading={loading}
      busqueda={busqueda}
      onBusquedaChange={setBusqueda}
      onSelectConversacion={abrirConversacion}
      onEliminarConversacion={handleDeleteConversacion}
      mensajes={mensajes}
      loadingMensajes={loadingMensajes}
      selectedConversacion={selectedConversacion}
      messagesEndRef={messagesEndRef}
      nuevoMensaje={nuevoMensaje}
      enviando={enviando}
      onNuevoMensajeChange={setNuevoMensaje}
      onEnviarMensaje={enviarMensaje}
      onKeyDown={handleKeyDown}
      onVolver={onVolver}
      formatJid={formatJid}
      formatTimestamp={formatTimestamp}
      formatDate={formatDate}
    />
  );
};
