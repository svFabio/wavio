import { ArrowLeft, Phone } from 'lucide-react';
import type { MensajeChat, Conversacion } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface MessagePanelProps {
  mensajes: MensajeChat[];
  loadingMensajes: boolean;
  selectedConversacion: Conversacion;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onVolver: () => void;
  formatJid: (jid: string) => string;
  formatTimestamp: (ts: string) => string;
  nuevoMensaje: string;
  enviando: boolean;
  onNuevoMensajeChange: (value: string) => void;
  onEnviarMensaje: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const MessagePanel = ({
  mensajes,
  loadingMensajes,
  selectedConversacion,
  messagesEndRef,
  onVolver,
  formatJid,
  formatTimestamp,
  nuevoMensaje,
  enviando,
  onNuevoMensajeChange,
  onEnviarMensaje,
  onKeyDown,
}: MessagePanelProps) => {
  return (
    <>
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-3">
        <button
          onClick={onVolver}
          aria-label="Volver a conversaciones"
          className="md:hidden p-1.5 hover:bg-surface-elevated rounded-full text-txt-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shadow-sm">
          {selectedConversacion.clienteNombre?.slice(0, 2).toUpperCase() ??
            formatJid(selectedConversacion.remoteJid).slice(-2)}
        </div>
        <div className="flex-1">
          <p className="text-txt font-semibold text-sm">
            {selectedConversacion.clienteNombre ?? formatJid(selectedConversacion.remoteJid)}
          </p>
          <p className="text-txt-muted text-xs flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {selectedConversacion.telefonoReal || formatJid(selectedConversacion.remoteJid)}
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {loadingMensajes ? (
          <div className="space-y-4 p-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`skeleton rounded-2xl ${i % 2 === 0 ? 'w-3/5 h-10' : 'w-2/5 h-8'}`}
                />
              </div>
            ))}
          </div>
        ) : (
          mensajes.map((msg) => (
            <MessageBubble key={msg.id} message={msg} formatTimestamp={formatTimestamp} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-surface border-t border-border">
        <MessageInput
          value={nuevoMensaje}
          onChange={onNuevoMensajeChange}
          onSend={onEnviarMensaje}
          onKeyDown={onKeyDown}
          disabled={enviando}
        />
      </div>
    </>
  );
};
