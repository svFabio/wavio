import { Mail, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { EmptyState } from './EmptyState';
import type { Invitation, InvitationEstado } from '../types';

interface InvitationsViewProps {
  invitations: Invitation[];
  onResend: (id: number) => void;
  onCancel: (id: number) => void;
}

const estadoConfig: Record<
  InvitationEstado,
  { label: string; icon: typeof Clock; className: string }
> = {
  PENDIENTE: {
    label: 'Pendiente',
    icon: Clock,
    className: 'text-warning bg-warning/10 border-warning/20',
  },
  ACEPTADA: {
    label: 'Aceptada',
    icon: CheckCircle2,
    className: 'text-success bg-success/10 border-success/20',
  },
  CANCELADA: {
    label: 'Cancelada',
    icon: Ban,
    className: 'text-txt-muted bg-surface-elevated border-border-light',
  },
  EXPIRADA: {
    label: 'Expirada',
    icon: XCircle,
    className: 'text-danger bg-danger/10 border-danger/20',
  },
};

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

export const InvitationsView = ({
  invitations,
  onResend,
  onCancel,
}: InvitationsViewProps): React.JSX.Element => {
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Sin invitaciones pendientes"
        description="Invita miembros del equipo a tu negocio."
        className="card-modern mt-6"
      />
    );
  }

  return (
    <div className="card-modern overflow-hidden mt-6">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-bold text-txt">Invitaciones pendientes</h3>
      </div>
      <table className="w-full">
        <thead className="bg-surface-elevated/50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Correo</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Rol</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Estado</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Expira</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Enviado</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const config = estadoConfig[inv.estado];
            const StatusIcon = config.icon;

            return (
              <tr key={inv.id} className="border-t border-border-light hover:bg-surface-alt/50">
                <td className="py-3 px-4 text-sm text-txt">{inv.email}</td>
                <td className="py-3 px-4">
                  <span className={`badge ${inv.rol === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                    {inv.rol}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-txt-secondary">{formatDate(inv.expiraEn)}</td>
                <td className="py-3 px-4 text-sm text-txt-secondary">{formatDate(inv.creadoEn)}</td>
                <td className="py-3 px-4 text-right">
                  {inv.estado === 'PENDIENTE' && (
                    <>
                      <button
                        onClick={() => onResend(inv.id)}
                        className="text-xs font-medium text-primary hover:text-primary-dark mr-3"
                      >
                        Reenviar
                      </button>
                      <button
                        onClick={() => onCancel(inv.id)}
                        className="text-xs font-medium text-danger hover:text-danger/80"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
