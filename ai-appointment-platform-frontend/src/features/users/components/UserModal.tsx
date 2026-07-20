import { useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useModalAccessibility } from '../../../shared/hooks/useModalAccessibility';
import type { User, UserFormData } from '../types';

interface UserModalProps {
  isOpen: boolean;
  editingUser: User | null;
  formData: UserFormData;
  isSaving: boolean;
  onFormDataChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserModal = ({
  isOpen,
  editingUser,
  formData,
  isSaving,
  onFormDataChange,
  onSubmit,
  onClose,
}: UserModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { handleKeyDown } = useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
  });

  if (!isOpen) return null;

  const update = (patch: Partial<UserFormData>) => onFormDataChange({ ...formData, ...patch });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        onKeyDown={handleKeyDown}
        className="bg-surface rounded-lg p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-txt">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-txt-muted hover:text-txt">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-txt mb-1">Nombre</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => update({ nombre: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => update({ email: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt mb-1">
              Contraseña {editingUser && '(dejar vacio para no cambiar)'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => update({ password: e.target.value })}
              className="input-modern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt mb-1">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => update({ rol: e.target.value as 'ADMIN' | 'STAFF' })}
              className="input-modern"
            >
              <option value="STAFF">STAFF (Recepcionista)</option>
              <option value="ADMIN">ADMIN (Administrador)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingUser ? (
                'Actualizar'
              ) : (
                'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
