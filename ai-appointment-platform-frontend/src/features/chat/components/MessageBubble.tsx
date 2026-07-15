import type { MensajeChat } from '../types';

interface MessageBubbleProps {
  message: MensajeChat;
  formatTimestamp: (ts: string) => string;
}

export const MessageBubble = ({ message, formatTimestamp }: MessageBubbleProps) => {
  return (
    <div className={`flex ${message.direccion === 'SALIENTE' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm
                ${
                  message.direccion === 'SALIENTE'
                    ? 'bg-primary text-on-primary rounded-tr-sm'
                    : 'bg-surface text-txt rounded-tl-sm border border-border'
                }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.contenido}</p>
        <div
          className={`flex items-center gap-1 mt-1 ${message.direccion === 'SALIENTE' ? 'justify-end text-on-primary/70' : 'text-txt-muted'}`}
        >
          <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
          {message.direccion === 'SALIENTE' && <span className="text-xs">{'\u2713\u2713'}</span>}
        </div>
      </div>
    </div>
  );
};
