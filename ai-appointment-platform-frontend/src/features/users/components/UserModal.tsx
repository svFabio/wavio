import { Loader2, ShieldAlert } from 'lucide-react';
import { ModalShell } from '../../../shared/components/ModalShell';
import type { User, UserFormData } from '../types';

interface UserModalProps {
  isOpen: boolean;
  editingUser: User | null;
  formData: UserFormData;
  isSaving: boolean;
  /** Role of the authenticated user viewing this modal */
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF';
  /** Total number of admins (including OWNER) in the negocio — used to prevent demoting the last admin */
  adminCount: number;
  onFormDataChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserModal = ({
  isOpen,
  editingUser,
  formData,
  isSaving,
  viewerRole,
  adminCount,
  onFormDataChange,
  onSubmit,
  onClose,
}: UserModalProps): React.JSX.Element | null => {
  const isOwner = viewerRole === 'OWNER';
  const isEditingOwner = editingUser?.rol === 'OWNER';

  // Only OWNER can assign ADMIN role. ADMINs can only create STAFF.
  const canAssignAdmin = isOwner;

  // Prevent demoting the last admin: if editing the only admin (and viewer is OWNER), block.
  const isLastAdmin = editingUser?.rol === 'ADMIN' && adminCount <= 1 && formData.rol === 'STAFF';

  const update = (patch: Partial<UserFormData>) => onFormDataChange({ ...formData, ...patch });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
      size="md"
    >
      <div className="p-6">
        {isEditingOwner && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-md bg-warning/10 border border-warning/30">
            <ShieldAlert className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-sm text-txt-secondary">
              La cuenta del <strong>propietario</strong> no se puede modificar.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-txt mb-1">Nombre</label>
            <input
              type="text"
              required
              disabled={isEditingOwner}
              value={formData.nombre}
              onChange={(e) => update({ nombre: e.target.value })}
              className="input-modern disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              disabled={isEditingOwner}
              value={formData.email}
              onChange={(e) => update({ email: e.target.value })}
              className="input-modern disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {!isEditingOwner && (
            <div>
              <label className="block text-sm font-medium text-txt mb-1">
                Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => update({ password: e.target.value })}
                className="input-modern"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-txt mb-1">Rol</label>
            {isEditingOwner ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-warning">OWNER</span>
                <span className="text-xs text-txt-muted">No se puede cambiar</span>
              </div>
            ) : (
              <>
                <select
                  value={formData.rol}
                  onChange={(e) => update({ rol: e.target.value as 'ADMIN' | 'STAFF' })}
                  className="input-modern"
                >
                  <option value="STAFF">STAFF (Recepcionista)</option>
                  {canAssignAdmin && <option value="ADMIN">ADMIN (Administrador)</option>}
                </select>
                {isLastAdmin && (
                  <p className="text-xs text-danger mt-1">
                    No se puede degradar: es el único administrador.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            {!isEditingOwner && (
              <button
                type="submit"
                disabled={isSaving || isLastAdmin}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingUser ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </ModalShell>
  );
};
