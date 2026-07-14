import { Plus } from 'lucide-react';
import type { User } from '../types';
import { UserCard } from './UserCard';
import { UserCardMobile } from './UserCardMobile';

interface UsersViewProps {
  users: User[];
  onOpenModal: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UsersView = ({ users, onOpenModal, onEdit, onDelete }: UsersViewProps) => (
  <div>
    {/* ── Desktop: tabla ── */}
    <div className="hidden md:block card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-txt">Gestion de Usuarios</h2>
            <p className="text-sm text-txt-muted mt-1">Administra los usuarios del sistema</p>
          </div>
          <button onClick={onOpenModal} className="btn-primary">
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead className="bg-surface-elevated/50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Nombre</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Email</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Rol</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Creado</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserCard key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>

    {/* ── Mobile: cards ── */}
    <div className="md:hidden space-y-3">
      {users.map((user) => (
        <UserCardMobile key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  </div>
);
