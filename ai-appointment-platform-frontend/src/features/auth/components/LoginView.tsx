import { Loader2, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';
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
  onGoogleLogin: () => void;
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
  onGoogleLogin,
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
            <div className="space-y-3">
              <p className="text-sm text-txt-secondary text-center">
                Tienes acceso a multiples negocios. Elige a cual quieres entrar.
              </p>
              {pendingData.negocios.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onNegocioSelect(n.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-txt truncate">{n.nombre}</p>
                    <span
                      className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        n.plan === 'PRO'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-surface-elevated text-txt-muted'
                      }`}
                    >
                      {n.plan}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex bg-surface-elevated p-1 rounded-xl">
                {(['login', 'register'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onTabChange(t)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      tab === t
                        ? 'bg-surface text-txt shadow-sm border border-border'
                        : 'text-txt-muted hover:text-txt'
                    }`}
                  >
                    {t === 'login' ? 'Iniciar sesion' : 'Registrarse'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-danger-light border border-danger/20 rounded-xl p-3 text-danger text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-surface border border-border hover:border-txt-muted hover:bg-surface-elevated rounded-xl py-3 text-sm font-medium text-txt transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M47.532 24.552c0-1.636-.147-3.2-.404-4.704H24.48v9.02h12.956c-.568 2.952-2.24 5.42-4.74 7.08v5.908h7.664c4.484-4.136 7.172-10.228 7.172-17.304z"
                    fill="#4285F4"
                  />
                  <path
                    d="M24.48 48c6.48 0 11.916-2.148 15.876-5.844l-7.664-5.908c-2.148 1.44-4.892 2.292-8.212 2.292-6.312 0-11.664-4.264-13.572-9.996H2.956v6.096C6.9 42.9 15.12 48 24.48 48z"
                    fill="#34A853"
                  />
                  <path
                    d="M10.908 28.544A14.447 14.447 0 0 1 10.08 24c0-1.576.276-3.104.828-4.544v-6.096H2.956A23.964 23.964 0 0 0 .48 24c0 3.876.932 7.548 2.476 10.64l8.436-6.096H10.908z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M24.48 9.46c3.552 0 6.74 1.224 9.248 3.612l6.908-6.908C36.392 2.148 30.96 0 24.48 0 15.12 0 6.9 5.1 2.956 13.36l8.436 6.096c1.908-5.732 7.26-9.996 13.088-9.996z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar con Google
              </button>

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

                <div className="relative">
                  <label htmlFor="login-password" className="sr-only">
                    Contrasena
                  </label>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="Contrasena"
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className="input-modern pr-10"
                  />
                  <button
                    type="button"
                    onClick={onShowPasswordToggle}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

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
