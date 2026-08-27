import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../api/auth.api';
import { LoginView } from '../components/LoginView';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import type { LoginResponse, Tab } from '../types';

export const LoginContainer = () => {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<LoginResponse | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getTargetDestination = (): string => {
    const stateFrom = (
      location.state as { from?: string | { pathname: string; search?: string; hash?: string } }
    )?.from;
    if (!stateFrom) return '/dashboard';
    if (typeof stateFrom === 'string') return stateFrom;
    return `${stateFrom.pathname || '/dashboard'}${stateFrom.search || ''}${stateFrom.hash || ''}`;
  };

  const from = getTargetDestination();

  const completeLogin = (data: LoginResponse, negocioId?: number) => {
    const negocios = negocioId ? data.negocios.filter((n) => n.id === negocioId) : data.negocios;
    login(data.token, data.usuario, negocios);
    navigate(data.esNuevo ? '/onboarding' : from, { replace: true });
  };

  const handleSuccess = (data: LoginResponse) => {
    if (data.negocios.length === 0) {
      setError('No tienes negocios asociados');
      return;
    }
    if (data.negocios.length === 1) {
      completeLogin(data);
      return;
    }
    setPendingData(data);
  };

  const handleNegocioSelect = (negocioId: number) => {
    if (!pendingData) return;
    completeLogin(pendingData, negocioId);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        tab === 'login'
          ? await authApi.login(email, password)
          : await authApi.register(email, password);
      handleSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.loginConGoogle(credential);
      handleSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al conectar con Google. Intentalo de nuevo.');
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  return (
    <ErrorBoundary>
      <LoginView
        tab={tab}
        email={email}
        password={password}
        error={error}
        loading={loading}
        pendingData={pendingData}
        showPassword={showPassword}
        onTabChange={switchTab}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onShowPasswordToggle={() => setShowPassword((s) => !s)}
        onSubmit={handleEmailSubmit}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={handleGoogleError}
        onNegocioSelect={handleNegocioSelect}
      />
    </ErrorBoundary>
  );
};
