import { MessageCircle } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-txt-muted">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center">
        <MessageCircle className="w-8 h-8 text-txt-muted/50" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-txt">Selecciona una conversación</h3>
        <p className="text-xs text-txt-muted mt-1">Los mensajes de WhatsApp aparecerán aquí</p>
      </div>
    </div>
  );
};
