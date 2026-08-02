import { GoogleLogin } from '@react-oauth/google';
import { Loader2, AlertCircle } from 'lucide-react';
import { PasswordField } from '../../../shared/components/PasswordField';
import { TabSelector } from './TabSelector';
import { NegocioSelectorList } from './NegocioSelectorList';
import type { LoginResponse, Tab } from '../types';

interface LoginViewProps {
  tab: Tab;
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
  pendingData: LoginResponse | null;
  showPassword: boolean;
  onTabChange: (tab: Tab) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSuccess: (credential: string) => void;
  onGoogleError: () => void;
  onNegocioSelect: (negocioId: number) => void;
}

export const LoginView = ({
  tab,
  email,
  password,
  error,
  loading,
  pendingData,
  showPassword,
  onTabChange,
  onEmailChange,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onGoogleSuccess,
  onGoogleError,
  onNegocioSelect,
}: LoginViewProps) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-alt p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-on-primary text-xl mb-4 shadow-lg">
            {'\uD83D\uDCAC'}
          </div>
          <h1 className="text-txt text-2xl font-bold tracking-tight">CitasWA</h1>
          <p className="text-txt-muted text-sm mt-1">
            {pendingData
              ? 'Selecciona un negocio'
              : tab === 'login'
                ? 'Bienvenido de vuelta'
                : 'Crea tu cuenta gratis'}
          </p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-5">
          {pendingData ? (
            <NegocioSelectorList negocios={pendingData.negocios} onSelect={onNegocioSelect} />
          ) : (
            <>
              <TabSelector tab={tab} onTabChange={onTabChange} />
              {error && (
                <div className="flex items-start gap-2 bg-danger-light border border-danger/20 rounded-xl p-3 text-danger text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(res) =>
                    res.credential ? onGoogleSuccess(res.credential) : onGoogleError()
                  }
                  onError={onGoogleError}
                  text="continue_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>
              <div className="flex items-center gap-3">
                <hr className="flex-1 border-border" />
                <span className="text-xs text-txt-muted">o con email</span>
                <hr className="flex-1 border-border" />
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                <label htmlFor="login-email" className="sr-only">
                  Correo electronico
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  autoComplete="email"
                  className="input-modern"
                />

                <PasswordField
                  id="login-password"
                  value={password}
                  onChange={onPasswordChange}
                  showPassword={showPassword}
                  onToggleShow={onShowPasswordToggle}
                  label="Contrasena"
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando...
                    </>
                  ) : tab === 'login' ? (
                    'Iniciar sesion'
                  ) : (
                    'Crear cuenta'
                  )}
                </button>
              </form>

              {tab === 'register' && (
                <p className="text-center text-xs text-txt-muted">
                  Luego podras ponerle nombre a tu negocio
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-txt-muted mt-6">
          {'\u00A9'} {new Date().getFullYear()} CitasWA
        </p>
      </div>
    </div>
  );
};
