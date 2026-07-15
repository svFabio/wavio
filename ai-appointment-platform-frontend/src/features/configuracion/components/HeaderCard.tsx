import { Loader2, Check, Save } from 'lucide-react';

interface HeaderCardProps {
  isPending: boolean;
  isSuccess: boolean;
  onSave: () => void;
}

export const HeaderCard = ({ isPending, isSuccess, onSave }: HeaderCardProps) => (
  <div className="card-modern overflow-hidden">
    <div className="p-5 md:p-6 border-b border-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-txt">Configuracion del Bot</h2>
          <p className="text-sm text-txt-muted mt-1">
            Personaliza el flujo de conversacion de WhatsApp
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-on-primary bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? 'Guardando...' : isSuccess ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
);
