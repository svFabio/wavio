import { Pencil, Trash2 } from 'lucide-react';
import type { User } from '../types';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => (
  <tr className="border-t border-border-light hover:bg-surface-alt/50">
    <td className="py-3 px-4 text-sm text-txt">{user.nombre}</td>
    <td className="py-3 px-4 text-sm text-txt-secondary">{user.email}</td>
    <td className="py-3 px-4">
      <span className={`badge ${user.rol === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
        {user.rol}
      </span>
    </td>
    <td className="py-3 px-4 text-sm text-txt-secondary">
      {new Date(user.creadoEn).toLocaleDateString()}
    </td>
    <td className="py-3 px-4 text-right">
      <button
        onClick={() => onEdit(user)}
        aria-label={`Editar ${user.nombre}`}
        className="text-primary hover:text-primary-dark mr-3"
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
    </td>
  </tr>
);
