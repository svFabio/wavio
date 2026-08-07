import { Mail, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import type { Invitation } from '../types';

interface InvitationsViewProps {
  invitations: Invitation[];
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'text-warning bg-warning/10 border-warning/20',
  },
  ACCEPTED: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'text-success bg-success/10 border-success/20',
  },
  EXPIRED: {
    label: 'Expired',
    icon: XCircle,
    className: 'text-danger bg-danger/10 border-danger/20',
  },
};

export const InvitationsView = ({
  invitations,
  onResend,
  onCancel,
}: InvitationsViewProps): React.JSX.Element => {
  if (invitations.length === 0) {
    return <EmptyState icon={Mail} title="No pending invitations" className="card-modern" />;
  }

  return (
    <div className="card-modern overflow-hidden mt-6">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-bold text-txt">Pending Invitations</h3>
      </div>
      <table className="w-full">
        <thead className="bg-surface-elevated/50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Email</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Role</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Sent On</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => {
            const config = statusConfig[inv.status];
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
                <td className="py-3 px-4 text-sm text-txt-secondary">
                  {new Date(inv.creadoEn).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  {inv.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => onResend(inv.id)}
                        className="text-xs font-medium text-primary hover:text-primary-dark mr-3"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => onCancel(inv.id)}
                        className="text-xs font-medium text-danger hover:text-danger/80"
                      >
                        Cancel
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
