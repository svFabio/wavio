import { Plus, UserPlus } from 'lucide-react';
import type { User } from '../types';
import { UserCard } from './UserCard';
import { UserCardMobile } from './UserCardMobile';

interface UsersViewProps {
  users: User[];
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF';
  onOpenModal: () => void;
  onInvite: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UsersView = ({
  users,
  viewerRole,
  onOpenModal,
  onInvite,
  onEdit,
  onDelete,
}: UsersViewProps): React.JSX.Element => {
  const canInvite = viewerRole !== 'STAFF';

  return (
    <div>
      {/* ── Desktop: table ── */}
      <div className="hidden md:block card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-txt">Miembros del equipo</h2>
              <p className="text-sm text-txt-muted mt-1">Gestiona los usuarios de tu negocio</p>
            </div>
            <div className="flex gap-2">
              {canInvite && (
                <button onClick={onInvite} className="btn-secondary">
                  <UserPlus className="w-5 h-5" />
                  Invitar
                </button>
              )}
              <button onClick={onOpenModal} className="btn-primary">
                <Plus className="w-5 h-5" />
                Agregar usuario
              </button>
            </div>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-surface-elevated/50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Nombre</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Correo</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Rol</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Creado</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                viewerRole={viewerRole}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden space-y-3">
        <div className="card-modern p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-txt">Miembros del equipo</h2>
              <p className="text-sm text-txt-muted mt-1">Gestiona los usuarios de tu negocio</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {canInvite && (
                <button onClick={onInvite} className="btn-secondary">
                  <UserPlus className="w-4 h-4" />
                  Invitar
                </button>
              )}
              <button onClick={onOpenModal} className="btn-primary">
                <Plus className="w-4 h-4" />
                Agregar usuario
              </button>
            </div>
          </div>
        </div>
        {users.map((user) => (
          <UserCardMobile
            key={user.id}
            user={user}
            viewerRole={viewerRole}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
