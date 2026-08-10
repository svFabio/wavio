import type { User } from '../types';
import { ROLE_BADGE_CLASS, canUserModifyRow } from '../utils';
import { UserRowActions } from './UserRowActions';

interface UserCardProps {
  user: User;
  /** Role of the authenticated user viewing this row */
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF';
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UserCard = ({
  user,
  viewerRole,
  onEdit,
  onDelete,
}: UserCardProps): React.JSX.Element => {
  const canModify = canUserModifyRow(user.rol, viewerRole);

  return (
    <tr className="border-t border-border-light hover:bg-surface-alt/50">
      <td className="py-3 px-4 text-sm text-txt">{user.nombre}</td>
      <td className="py-3 px-4 text-sm text-txt-secondary">{user.email}</td>
      <td className="py-3 px-4">
        <span className={ROLE_BADGE_CLASS[user.rol]}>{user.rol}</span>
      </td>
      <td className="py-3 px-4 text-sm text-txt-secondary">
        {new Date(user.creadoEn).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-right">
        {canModify ? (
          <UserRowActions user={user} onEdit={onEdit} onDelete={onDelete} className="justify-end" />
        ) : (
          <span className="text-xs text-txt-muted italic">Protegido</span>
        )}
      </td>
    </tr>
  );
};
