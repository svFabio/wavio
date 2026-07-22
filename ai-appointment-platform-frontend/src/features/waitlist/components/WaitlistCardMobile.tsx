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

interface WaitlistCardMobileProps {
  entry: WaitlistEntry;
  onNotify: (id: number) => void;
  onRemove: (id: number) => void;
  isNotifying: boolean;
  isRemoving: boolean;
}

export const WaitlistCardMobile = ({
  entry,
  onNotify,
  onRemove,
  isNotifying,
  isRemoving,
}: WaitlistCardMobileProps) => {
  const fechaFormateada = format(new Date(entry.fechaPreferida), "EEEE d 'de' MMMM", {
    locale: es,
  });

  return (
    <div className="card-modern p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-txt capitalize">{entry.clienteNombre}</h3>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ESTADO_STYLES[entry.estado]}`}
            >
              {ESTADO_LABELS[entry.estado]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {entry.estado === 'PENDIENTE' && (
            <button
              onClick={() => onNotify(entry.id)}
              disabled={isNotifying}
              title="Notificar por WhatsApp"
              className="p-2 text-primary hover:bg-primary-light rounded-lg transition-colors disabled:opacity-50"
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

      <div className="space-y-2 text-sm text-txt-secondary border-t border-border-light pt-3">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-txt-muted" />
          {entry.clienteTelefono}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-txt-muted" />
          {fechaFormateada}
        </div>
        {entry.horarioPreferido && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-txt-muted" />
            {entry.horarioPreferido}
          </div>
        )}
      </div>
    </div>
  );
};
