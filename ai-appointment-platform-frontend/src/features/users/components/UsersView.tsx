import { Plus } from 'lucide-react';
import type { User } from '../types';
import { UserCard } from './UserCard';
import { UserCardMobile } from './UserCardMobile';

interface UsersViewProps {
  users: User[];
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF';
  onOpenModal: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UsersView = ({
  users,
  viewerRole,
  onOpenModal,
  onEdit,
  onDelete,
}: UsersViewProps): React.JSX.Element => (
  <div>
    {/* ── Desktop: table ── */}
    <div className="hidden md:block card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-txt">User Management</h2>
            <p className="text-sm text-txt-muted mt-1">Manage your business users</p>
          </div>
          <button onClick={onOpenModal} className="btn-primary">
            <Plus className="w-5 h-5" />
            New User
          </button>
        </div>
      </div>
      <table className="w-full">
        <thead className="bg-surface-elevated/50">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Email</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Role</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-txt">Created</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-txt">Actions</th>
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
