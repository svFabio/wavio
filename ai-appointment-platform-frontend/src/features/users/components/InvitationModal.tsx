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
    <ModalShell isOpen={isOpen} onClose={onClose} title="Invite Team Member" size="md">
      <div className="p-6">
        <p className="text-sm text-txt-secondary mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Send an email invitation. They will set their own password when they accept it.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-txt mb-1">Email address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => update({ email: e.target.value })}
              className="input-modern"
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt mb-1">Role</label>
            <select
              value={formData.rol}
              onChange={(e) => update({ rol: e.target.value as 'ADMIN' | 'STAFF' })}
              className="input-modern"
            >
              <option value="STAFF">STAFF (Receptionist)</option>
              <option value="ADMIN">ADMIN (Administrator)</option>
            </select>
            <p className="text-xs text-txt-muted mt-1">
              Admins can manage configuration and other staff.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};
