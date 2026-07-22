import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Trash2 } from 'lucide-react';
import type { WaitlistEntry } from '../types';

const ESTADO_LABELS: Record<WaitlistEntry['estado'], string> = {
  PENDIENTE: 'Pendiente',
  NOTIFICADA: 'Notificada',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

const ESTADO_STYLES: Record<WaitlistEntry['estado'], string> = {
  PENDIENTE: 'badge-warning',
  NOTIFICADA: 'badge-primary',
  CONFIRMADA: 'badge-success',
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
    <tr className="border-t border-border-light hover:bg-surface-alt/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-txt capitalize">{entry.clienteNombre}</td>
      <td className="py-3 px-4 text-sm text-txt-secondary">{entry.clienteTelefono}</td>
      <td className="py-3 px-4 text-sm text-txt-secondary">
        {fechaFormateada} {entry.horarioPreferido ? ` a las ${entry.horarioPreferido}` : ''}
      </td>
      <td className="py-3 px-4">
        <span className={`badge ${ESTADO_STYLES[entry.estado]}`}>
          {ESTADO_LABELS[entry.estado]}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        {entry.estado === 'PENDIENTE' && (
          <button
            onClick={() => onNotify(entry.id)}
            disabled={isNotifying}
            title="Notificar por WhatsApp"
            className="text-primary hover:text-primary-dark mr-3 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(entry.id)}
          disabled={isRemoving}
          title="Eliminar"
          className="text-danger hover:text-danger/80 disabled:opacity-50 inline-block"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
