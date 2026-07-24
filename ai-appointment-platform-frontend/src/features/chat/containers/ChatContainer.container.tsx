import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import type { Conversacion } from '../types';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ChatView } from '../components/ChatView';
import { useChatState, formatJid, formatTimestamp, formatDate } from '../hooks/useChatState';

export const ChatContainer = (): React.JSX.Element => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const [jidToDelete, setJidToDelete] = useState<string | null>(null);

  const {
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
  } = useChatState();

  const abrirConversacion = (jid: string) => {
    setSelectedJid(jid);
    setNuevoMensaje('');
  };

  const enviarMensaje = async () => {
    if (!selectedJid || !nuevoMensaje.trim() || enviando) return;
    setEnviando(true);
    try {
      const result = await chatApi.enviarMensajeChat(selectedJid, nuevoMensaje.trim());
      if (result.success) {
        setNuevoMensaje('');
      }
    } catch (error) {
      showNotification('Error enviando mensaje. Intenta de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleDeleteConversacion = (e: React.MouseEvent, jid: string) => {
    e.stopPropagation();
    setJidToDelete(jid);
  };

  const confirmDeleteConversacion = async () => {
    if (!jidToDelete) return;
    try {
      const result = await chatApi.eliminarConversacion(jidToDelete);
      if (result.success) {
        queryClient.setQueryData<Conversacion[]>(['conversaciones'], (old) => {
          if (!old) return old;
          return old.filter((c) => c.remoteJid !== jidToDelete);
        });
        if (selectedJid === jidToDelete) setSelectedJid(null);
      }
    } catch (error) {
      showNotification('Error eliminando conversación.', 'error');
    } finally {
      setJidToDelete(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const onVolver = () => setSelectedJid(null);

  return (
    <>
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
      <ConfirmModal
        isOpen={!!jidToDelete}
        onClose={() => setJidToDelete(null)}
        onConfirm={confirmDeleteConversacion}
        title="Eliminar Conversación"
        message="¿Estás seguro de que deseas eliminar esta conversación y todos sus mensajes de la base de datos?"
        confirmText="Eliminar"
        isDanger={true}
      />
    </>
  );
};
