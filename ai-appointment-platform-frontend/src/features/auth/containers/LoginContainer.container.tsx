import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { LoginView } from '../components/LoginView';
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
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

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
        tab === 'login' ? await api.login(email, password) : await api.register(email, password);
      handleSuccess(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);
      try {
        const data = await api.loginConGoogle(tokenResponse.access_token);
        handleSuccess(data);
      } catch (err: unknown) {
        setError((err as Error).message || 'Error al iniciar sesion con Google');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Error al conectar con Google. Intentalo de nuevo.'),
  });

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
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
      onGoogleLogin={() => googleLogin()}
      onNegocioSelect={handleNegocioSelect}
    />
  );
};
