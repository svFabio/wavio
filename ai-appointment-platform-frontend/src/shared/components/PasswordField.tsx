import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  label: string;
  autoComplete: string;
}

export const PasswordField = ({
  id,
  value,
  onChange,
  showPassword,
  onToggleShow,
  placeholder = 'Contrasena',
  label,
  autoComplete,
}: PasswordFieldProps) => (
  <div className="relative">
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <input
      id={id}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required
      autoComplete={autoComplete}
      className="input-modern pr-10"
    />
    <button
      type="button"
      onClick={onToggleShow}
      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt transition-colors"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);
