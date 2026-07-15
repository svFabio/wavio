import { MessageCircle, Phone, Search, WifiOff, Trash2 } from 'lucide-react';
import type { Conversacion } from '../types';

interface ConversationListProps {
  conversaciones: Conversacion[];
  selectedJid: string | null;
  loading: boolean;
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  onSelectConversacion: (jid: string) => void;
  onEliminarConversacion: (e: React.MouseEvent, jid: string) => void;
  formatJid: (jid: string) => string;
  formatDate: (ts: string) => string;
}

export const ConversationList = ({
  conversaciones,
  selectedJid,
  loading,
  busqueda,
  onBusquedaChange,
  onSelectConversacion,
  onEliminarConversacion,
  formatJid,
  formatDate,
}: ConversationListProps) => {
  return (
    <>
      <div className="px-4 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-txt text-lg">Chats de WhatsApp</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted" />
          <label htmlFor="chat-search" className="sr-only">
            Buscar conversaciones
          </label>
          <input
            id="chat-search"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="input-modern pl-9"
            placeholder="Buscar por nombre o numero..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-3/5 rounded" />
                  <div className="skeleton h-2.5 w-4/5 rounded" />
                </div>
                <div className="skeleton h-2.5 w-10 rounded" />
              </div>
            ))}
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-txt-muted gap-2">
            <WifiOff className="w-8 h-8 opacity-50" />
            <p className="text-sm">No hay conversaciones aun</p>
          </div>
        ) : (
          conversaciones.map((conv) => (
            <button
              key={conv.remoteJid}
              onClick={() => onSelectConversacion(conv.remoteJid)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-alt transition-colors border-b border-border-light text-left group
                                ${
                                  selectedJid === conv.remoteJid
                                    ? 'bg-primary-light border-l-2 border-l-primary'
                                    : 'border-l-2 border-l-transparent'
                                }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {(conv.clienteNombre ?? formatJid(conv.remoteJid)).slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <span className="font-medium text-txt text-sm truncate block">
                  {conv.clienteNombre ?? formatJid(conv.remoteJid)}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="w-2.5 h-2.5 text-txt-muted shrink-0" />
                  <span className="text-xs text-txt-muted font-mono truncate">
                    {conv.telefonoReal || formatJid(conv.remoteJid)}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary mt-1 truncate">
                  {conv.ultimaDireccion === 'SALIENTE' && (
                    <span className="text-primary font-bold">{'\u2713\u2713 '} </span>
                  )}
                  {conv.ultimoContenido}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-txt-muted">{formatDate(conv.ultimoMensaje)}</span>
                <button
                  onClick={(e) => onEliminarConversacion(e, conv.remoteJid)}
                  aria-label="Eliminar conversacion"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-danger/60 hover:text-danger hover:bg-danger-light"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
};
