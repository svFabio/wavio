import { Pencil, Trash2 } from 'lucide-react';
import type { User } from '../types';

interface UserRowActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export const UserRowActions = ({
  user,
  onEdit,
  onDelete,
  className = '',
}: UserRowActionsProps): React.JSX.Element => (
  <div className={`flex items-center ${className}`}>
    <button
      onClick={() => onEdit(user)}
      aria-label={`Edit ${user.nombre}`}
      className="text-primary hover:text-primary-dark mr-3"
    >
      <Pencil className="w-4 h-4" />
    </button>
    <button
      onClick={() => onDelete(user.id)}
      aria-label={`Delete ${user.nombre}`}
      className="text-danger hover:text-danger/80"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);
