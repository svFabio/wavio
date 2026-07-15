import { Pencil, Trash2 } from 'lucide-react';
import type { User } from '../types';

interface UserCardMobileProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UserCardMobile = ({ user, onEdit, onDelete }: UserCardMobileProps) => (
  <div className="card-modern p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold text-txt text-sm truncate">{user.nombre}</p>
        <p className="text-xs text-txt-muted truncate mt-0.5">{user.email}</p>
      </div>
      <span className={`shrink-0 badge ${user.rol === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
        {user.rol}
      </span>
    </div>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
      <p className="text-xs text-txt-muted">
        Creado: {new Date(user.creadoEn).toLocaleDateString()}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(user)}
          aria-label={`Editar ${user.nombre}`}
          className="text-primary hover:text-primary-dark"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(user.id)}
          aria-label={`Eliminar ${user.nombre}`}
          className="text-danger hover:text-danger/80"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
