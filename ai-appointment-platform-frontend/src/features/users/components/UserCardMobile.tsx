import type { User } from '../types';
import { ROLE_BADGE_CLASS, canUserModifyRow } from '../utils';
import { UserRowActions } from './UserRowActions';

interface UserCardMobileProps {
  user: User;
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF';
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UserCardMobile = ({
  user,
  viewerRole,
  onEdit,
  onDelete,
}: UserCardMobileProps): React.JSX.Element => {
  const canModify = canUserModifyRow(user.rol, viewerRole);

  return (
    <div className="card-modern p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-txt text-sm truncate">{user.nombre}</p>
          <p className="text-xs text-txt-muted truncate mt-0.5">{user.email}</p>
        </div>
        <span className={`shrink-0 ${ROLE_BADGE_CLASS[user.rol]}`}>{user.rol}</span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
        <p className="text-xs text-txt-muted">
          Creado: {new Date(user.creadoEn).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-3">
          {canModify ? (
            <UserRowActions user={user} onEdit={onEdit} onDelete={onDelete} />
          ) : (
            <span className="text-xs text-txt-muted italic">Protegido</span>
          )}
        </div>
      </div>
    </div>
  );
};
