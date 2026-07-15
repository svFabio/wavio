import type { MensajeChat, Conversacion } from '../types';
import { ConversationList } from './ConversationList';
import { MessagePanel } from './MessagePanel';
import { EmptyState } from './EmptyState';

interface ChatViewProps {
  conversacionesFiltradas: Conversacion[];
  selectedJid: string | null;
  loading: boolean;
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  onSelectConversacion: (jid: string) => void;
  onEliminarConversacion: (e: React.MouseEvent, jid: string) => void;
  mensajes: MensajeChat[];
  loadingMensajes: boolean;
  selectedConversacion: Conversacion | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  nuevoMensaje: string;
  enviando: boolean;
  onNuevoMensajeChange: (value: string) => void;
  onEnviarMensaje: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onVolver: () => void;
  formatJid: (jid: string) => string;
  formatTimestamp: (ts: string) => string;
  formatDate: (ts: string) => string;
}

export const ChatView = ({
  conversacionesFiltradas,
  selectedJid,
  loading,
  busqueda,
  onBusquedaChange,
  onSelectConversacion,
  onEliminarConversacion,
  mensajes,
  loadingMensajes,
  selectedConversacion,
  messagesEndRef,
  nuevoMensaje,
  enviando,
  onNuevoMensajeChange,
  onEnviarMensaje,
  onKeyDown,
  onVolver,
  formatJid,
  formatTimestamp,
  formatDate,
}: ChatViewProps) => {
  return (
    <div className="h-[calc(100dvh-80px)] flex bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
      <div
        className={`${selectedJid ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border bg-surface`}
      >
        <ConversationList
          conversaciones={conversacionesFiltradas}
          selectedJid={selectedJid}
          loading={loading}
          busqueda={busqueda}
          onBusquedaChange={onBusquedaChange}
          onSelectConversacion={onSelectConversacion}
          onEliminarConversacion={onEliminarConversacion}
          formatJid={formatJid}
          formatDate={formatDate}
        />
      </div>

      <div
        className={`${selectedJid ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-surface-alt relative`}
      >
        {selectedJid && selectedConversacion ? (
          <MessagePanel
            mensajes={mensajes}
            loadingMensajes={loadingMensajes}
            selectedConversacion={selectedConversacion}
            messagesEndRef={messagesEndRef}
            onVolver={onVolver}
            formatJid={formatJid}
            formatTimestamp={formatTimestamp}
            nuevoMensaje={nuevoMensaje}
            enviando={enviando}
            onNuevoMensajeChange={onNuevoMensajeChange}
            onEnviarMensaje={onEnviarMensaje}
            onKeyDown={onKeyDown}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};
