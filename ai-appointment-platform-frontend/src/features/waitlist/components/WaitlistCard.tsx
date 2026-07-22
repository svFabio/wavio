import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Trash2, Clock, User, Phone, Calendar } from 'lucide-react';
import type { WaitlistEntry } from '../types';

const ESTADO_LABELS: Record<WaitlistEntry['estado'], string> = {
  PENDIENTE: 'Pendiente',
  NOTIFICADA: 'Notificada',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const ESTADO_STYLES: Record<WaitlistEntry['estado'], string> = {
  PENDIENTE: 'bg-warning/10 text-warning',
  NOTIFICADA: 'bg-primary/10 text-primary',
  CONFIRMADA: 'bg-success/10 text-success',
  CANCELADA: 'bg-border text-txt-muted',
};

interface WaitlistCardProps {
  entry: WaitlistEntry;
  onNotify: (id: number) => void;
  onRemove: (id: number) => void;
  isNotifying: boolean;
  isRemoving: boolean;
}

export const WaitlistCard = ({
  entry,
  onNotify,
  onRemove,
  isNotifying,
  isRemoving,
}: WaitlistCardProps) => {
  const fechaFormateada = format(new Date(entry.fechaPreferida), "EEEE d 'de' MMMM", {
    locale: es,
  });

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-txt capitalize">{entry.clienteNombre}</p>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ESTADO_STYLES[entry.estado]}`}
          >
            {ESTADO_LABELS[entry.estado]}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-txt-muted">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {entry.clienteTelefono}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fechaFormateada}
          </span>
          {entry.horarioPreferido && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {entry.horarioPreferido}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        {entry.estado === 'PENDIENTE' && (
          <button
            onClick={() => onNotify(entry.id)}
            disabled={isNotifying}
            title="Notificar por WhatsApp"
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(entry.id)}
          disabled={isRemoving}
          title="Eliminar"
          className="p-2 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
