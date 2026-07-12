import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const AdminWhatsapp = () => {
  const { negocio } = useAuth();
  const [status, setStatus] = useState<{
    conectado: boolean;
    phoneNumberId?: string;
    wabaId?: string;
  }>({ conectado: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [devToken, setDevToken] = useState('');
  const [devPhoneId, setDevPhoneId] = useState('');
  const [devWabaId, setDevWabaId] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await api.statusWhatsapp();
      if (res) {
        setStatus({
          conectado: res.connected,
          phoneNumberId: res.phone,
          wabaId: res.wabaId
        });
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID || 'TU_META_APP_ID',
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
    };
    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.src = 'https://connect.facebook.net/es_LA/sdk.js';
    document.body.appendChild(js);
  }, [negocio]);

  const launchFacebookLogin = () => {
    if (!window.FB) {
      setError('El SDK de Facebook no se ha cargado. Verifica tu conexion o deshabilita adblockers.');
      return;
    }

    setError('');

    window.FB.login(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        setLoading(true);
        if (response.authResponse) {
          setError('Autenticacion exitosa. Sin embargo, para completar el Embedded Signup en produccion, se requiere configurar el Facebook Login for Business en el panel de Meta.');
        } else {
          setError('El usuario cancelo el inicio de sesion o no lo autorizo por completo.');
        }
        setLoading(false);
      },
      {
        config_id: import.meta.env.VITE_META_CONFIG_ID || 'TU_CONFIG_ID',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '2'
        }
      }
    );
  };

  const handleSaveDevCredentials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.guardarCredencialesWhatsApp(devToken, devPhoneId, devWabaId);
      if (res.error) throw new Error(res.error);
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estas seguro de que deseas desvincular la cuenta de WhatsApp Oficial?')) return;

    setLoading(true);
    try {
      await api.desvincularWhatsApp();
      await fetchStatus();
    } catch {
      setError('Error al desvincular');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-xl shadow-sm border border-border">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-txt-secondary">Cargando estado de Meta WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-success-light rounded-full text-success">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-txt">WhatsApp Oficial (Meta)</h2>
          <p className="text-sm text-txt-secondary">Gestiona tu conexion con WhatsApp Cloud API</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-light border border-danger/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {status.conectado ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-success-light border border-success/20 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <div>
              <p className="font-medium text-txt">Conectado a Meta Oficial</p>
              <p className="text-sm text-txt-secondary">Phone Number ID: {status.phoneNumberId}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 border border-danger/20 text-danger rounded-lg hover:bg-danger-light transition-colors"
          >
            Desvincular WhatsApp Oficial
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-info-light border border-info/20 rounded-lg">
            <h3 className="font-semibold text-txt mb-2">Conexion Segura Oficial</h3>
            <p className="text-sm text-txt-secondary">
              Ahora usamos la API Oficial de Meta. Esto garantiza que tu numero no sera baneado y es 100% legal.
              <br/><br/>
              <b>Nota para desarrollo:</b> Facebook Login requiere <code>https://</code>. Si estas en localhost sin HTTPS, el boton no funcionara. Usa el modo manual abajo.
            </p>
          </div>

          <button
            onClick={launchFacebookLogin}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex justify-center items-center gap-2 shadow-sm"
          >
            Conectar con Facebook
          </button>

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-txt-muted mb-4 uppercase tracking-wider">Modo Desarrollo / Manual</h4>
            <p className="text-xs text-txt-muted mb-4">Si el Embedded Signup de Meta aun no esta configurado, puedes ingresar los tokens manualmente desde el panel de Meta for Developers.</p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Access Token Permanente"
                className="input-modern"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number ID"
                className="input-modern"
                value={devPhoneId}
                onChange={(e) => setDevPhoneId(e.target.value)}
              />
              <input
                type="text"
                placeholder="WABA ID (Business Account ID)"
                className="input-modern"
                value={devWabaId}
                onChange={(e) => setDevWabaId(e.target.value)}
              />
              <button
                onClick={handleSaveDevCredentials}
                disabled={!devToken || !devPhoneId || !devWabaId}
                className="w-full px-4 py-2 bg-txt text-white rounded-lg font-medium hover:bg-txt-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Credenciales Manuales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWhatsapp;
