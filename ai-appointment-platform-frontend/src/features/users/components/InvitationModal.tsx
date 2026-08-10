import { Loader2, Mail } from 'lucide-react';
import { ModalShell } from '../../../shared/components/ModalShell';
import type { InvitationFormData } from '../types';

interface InvitationModalProps {
  isOpen: boolean;
  formData: InvitationFormData;
  isSending: boolean;
  onFormDataChange: (data: InvitationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const InvitationModal = ({
  isOpen,
  formData,
  isSending,
  onFormDataChange,
  onSubmit,
  onClose,
}: InvitationModalProps): React.JSX.Element | null => {
  const update = (patch: Partial<InvitationFormData>) =>
    onFormDataChange({ ...formData, ...patch });

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Invitar miembro" size="md">
      <div className="p-6">
        <p className="text-sm text-txt-secondary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Envía una invitación por correo. El invitado establecerá su contraseña al aceptar.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-txt mb-1">
              Correo electrónico
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => update({ email: e.target.value })}
              className="input-modern"
              placeholder="colega@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="invite-rol" className="block text-sm font-medium text-txt mb-1">
              Rol
            </label>
            <select
              id="invite-rol"
              value={formData.rol}
              onChange={(e) => update({ rol: e.target.value as 'ADMIN' | 'STAFF' })}
              className="input-modern"
            >
              <option value="STAFF">STAFF (Recepcionista)</option>
              <option value="ADMIN">ADMIN (Administrador)</option>
            </select>
            <p className="text-xs text-txt-muted mt-1">
              Los administradores pueden gestionar la configuración y al personal.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                  Enviando...
                </>
              ) : (
                'Enviar invitación'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};
