interface DevCredentialsFormProps {
  devToken: string;
  onTokenChange: (value: string) => void;
  devPhoneId: string;
  onPhoneIdChange: (value: string) => void;
  devWabaId: string;
  onWabaIdChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
}

export const DevCredentialsForm = ({
  devToken,
  onTokenChange,
  devPhoneId,
  onPhoneIdChange,
  devWabaId,
  onWabaIdChange,
  onSave,
  saving,
  disabled,
}: DevCredentialsFormProps) => {
  return (
    <div className="pt-4 border-t border-border">
      <h4 className="text-xs font-semibold text-txt-muted uppercase tracking-wider mb-1">
        Modo Desarrollo
      </h4>
      <p className="text-xs text-txt-muted mb-4">
        Ingresa los tokens manualmente desde el panel de Meta for Developers.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Access Token Permanente"
          aria-label="Access Token Permanente"
          className="input-modern"
          value={devToken}
          onChange={(e) => onTokenChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone Number ID"
          aria-label="Phone Number ID"
          className="input-modern"
          value={devPhoneId}
          onChange={(e) => onPhoneIdChange(e.target.value)}
        />
        <input
          type="text"
          placeholder="WABA ID"
          aria-label="WABA ID"
          className="input-modern"
          value={devWabaId}
          onChange={(e) => onWabaIdChange(e.target.value)}
        />
        <button
          onClick={onSave}
          disabled={disabled}
          className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar Credenciales'}
        </button>
      </div>
    </div>
  );
};
