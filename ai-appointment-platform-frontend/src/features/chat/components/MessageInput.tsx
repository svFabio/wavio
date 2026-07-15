import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled,
}: MessageInputProps) => {
  return (
    <div className="flex items-end gap-2 relative">
      <label htmlFor="chat-message" className="sr-only">
        Escribe un mensaje
      </label>
      <textarea
        id="chat-message"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 input-modern pl-4 pr-12 py-3 resize-none max-h-32"
        rows={1}
        placeholder="Escribe un mensaje..."
        disabled={disabled}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        aria-label="Enviar mensaje"
        className="absolute right-2 bottom-2 p-2 bg-primary text-on-primary rounded-xl hover:bg-primary-dark transition-all disabled:opacity-40 disabled:scale-95 shadow-md"
      >
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  );
};
