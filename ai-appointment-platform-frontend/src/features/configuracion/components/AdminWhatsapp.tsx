import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle2, AlertCircle, Unplug } from 'lucide-react';
import { DevCredentialsForm } from './DevCredentialsForm';

interface FBLoginResponse {
  authResponse: unknown;
}

declare global {
  interface Window {
    FB: {
      init: (params: unknown) => void;
      login: (cb: (response: FBLoginResponse) => void, params: unknown) => void;
    };
    fbAsyncInit: () => void;
  }
}

export const AdminWhatsapp = () => {
  useAuth();
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => api.statusWhatsapp(),
  });

  const saveMutation = useMutation({
    mutationFn: (creds: { token: string; phoneId: string; wabaId: string }) =>
      api.guardarCredencialesWhatsApp(creds.token, creds.phoneId, creds.wabaId),
    onSuccess: (res) => {
      if (res.error) return;
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.desvincularWhatsApp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });

  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const [devPhoneId, setDevPhoneId] = useState('');
  const [devWabaId, setDevWabaId] = useState('');

  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID || 'TU_META_APP_ID',
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };
    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = 'https://connect.facebook.net/es_LA/sdk.js';
    document.body.appendChild(js);
  }, []);

  const launchFacebookLogin = () => {
    if (!window.FB) {
      setError(
        'El SDK de Facebook no se ha cargado. Verifica tu conexion o deshabilita adblockers.',
      );
      return;
    }
    setError('');
    window.FB.login(
      (response: FBLoginResponse) => {
        if (response.authResponse) {
          setError(
            'Autenticacion exitosa. Sin embargo, para completar el Embedded Signup en produccion, se requiere configurar el Facebook Login for Business en el panel de Meta.',
          );
        } else {
          setError('El usuario cancelo el inicio de sesion o no lo autorizo por completo.');
        }
      },
      {
        config_id: import.meta.env.VITE_META_CONFIG_ID || 'TU_CONFIG_ID',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '2',
        },
      },
    );
  };

  const handleSaveDevCredentials = () => {
    setError('');
    saveMutation.mutate({ token: devToken, phoneId: devPhoneId, wabaId: devWabaId });
  };

  const handleDisconnect = () => {
    if (!confirm('¿Estas seguro de que deseas desvincular la cuenta de WhatsApp Oficial?')) return;
    disconnectMutation.mutate();
  };

  const getErrorMessage = (err: unknown): string => (err instanceof Error ? err.message : '');

  const displayError =
    error ||
    getErrorMessage(queryError) ||
    getErrorMessage(saveMutation.error) ||
    getErrorMessage(disconnectMutation.error);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-12 rounded-xl" />
        <div className="border border-border-light rounded-xl p-4 space-y-4">
          <div className="skeleton h-3 w-48 rounded" />
          <div className="space-y-3">
            <div className="skeleton h-10 rounded-xl" />
            <div className="skeleton h-10 rounded-xl" />
            <div className="skeleton h-10 rounded-xl" />
          </div>
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {displayError && (
        <div className="p-4 bg-danger-light border border-danger/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{displayError}</p>
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-success-light border border-success/20 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-txt">Conectado a Meta Oficial</p>
              <p className="text-xs text-txt-muted mt-0.5">Phone Number ID: {status.phone}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-danger/20 text-danger text-sm font-medium rounded-xl hover:bg-danger-light transition-colors disabled:opacity-50"
          >
            <Unplug className="w-4 h-4" />
            {disconnectMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <button onClick={launchFacebookLogin} className="w-full btn-primary">
            Conectar con Facebook
          </button>

          <DevCredentialsForm
            devToken={devToken}
            onTokenChange={setDevToken}
            devPhoneId={devPhoneId}
            onPhoneIdChange={setDevPhoneId}
            devWabaId={devWabaId}
            onWabaIdChange={setDevWabaId}
            onSave={handleSaveDevCredentials}
            saving={saveMutation.isPending}
            disabled={!devToken || !devPhoneId || !devWabaId || saveMutation.isPending}
          />
        </div>
      )}
    </div>
  );
};

export default AdminWhatsapp;
