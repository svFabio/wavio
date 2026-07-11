import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const AdminWhatsapp: React.FC = () => {
  const { negocio } = useAuth();
  const [status, setStatus] = useState<{
    conectado: boolean;
    phoneNumberId?: string;
    wabaId?: string;
  }>({ conectado: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados temporales para desarrollo (hasta configurar el App ID de Facebook)
  const [devToken, setDevToken] = useState('');
  const [devPhoneId, setDevPhoneId] = useState('');
  const [devWabaId, setDevWabaId] = useState('');

  useEffect(() => {
    fetchStatus();
    
    // Cargar SDK de Facebook dinámicamente
    if (document.getElementById('facebook-jssdk')) return;
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID || 'TU_META_APP_ID', // Reemplazar con variable de entorno
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

  const fetchStatus = async () => {
    try {
      const res = await api.statusWhatsapp();
      if (res) {
        setStatus({
          conectado: res.conectado,
          phoneNumberId: res.phoneNumberId,
          wabaId: res.wabaId
        });
      }
    } catch (err) {
      console.error('Error fetching status', err);
    } finally {
      setLoading(false);
    }
  };

  const launchFacebookLogin = () => {
    if (!window.FB) {
      setError('El SDK de Facebook no se ha cargado. Verifica tu conexión o deshabilita adblockers.');
      return;
    }

    // No ponemos setLoading(true) aquí porque si FB bloquea el login (por ser HTTP local), el callback nunca se dispara y se queda cargando infinito.
    setError('');
    
    window.FB.login(
      (response: any) => {
        setLoading(true);
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          setError('Autenticación exitosa. Sin embargo, para completar el Embedded Signup en producción, se requiere configurar el Facebook Login for Business en el panel de Meta.');
        } else {
          setError('El usuario canceló el inicio de sesión o no lo autorizó por completo.');
        }
        setLoading(false);
      },
      {
        config_id: import.meta.env.VITE_META_CONFIG_ID || 'TU_CONFIG_ID', // Requerido para Embedded Signup
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
    } catch (err: any) {
      setError(err.message || 'Error al guardar credenciales');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desvincular la cuenta de WhatsApp Oficial?')) return;
    
    setLoading(true);
    try {
      await api.desvincularWhatsApp();
      await fetchStatus();
    } catch (err) {
      setError('Error al desvincular');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-[var(--border)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-[var(--text-secondary)]">Cargando estado de Meta WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-full text-green-600">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">WhatsApp Oficial (Meta)</h2>
          <p className="text-sm text-[var(--text-secondary)]">Gestiona tu conexión con WhatsApp Cloud API</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {status.conectado ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Conectado a Meta Oficial</p>
              <p className="text-sm text-green-700">Phone Number ID: {status.phoneNumberId}</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Desvincular WhatsApp Oficial
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Conexión Segura Oficial</h3>
            <p className="text-sm text-blue-800">
              Ahora usamos la API Oficial de Meta. Esto garantiza que tu número no será baneado y es 100% legal.
              <br/><br/>
              <b>Nota para desarrollo:</b> Facebook Login requiere <code>https://</code>. Si estás en localhost sin HTTPS, el botón no funcionará. Usa el modo manual abajo.
            </p>
          </div>

          <button
            onClick={launchFacebookLogin}
            className="w-full px-4 py-3 bg-[#1877F2] text-white rounded-lg font-medium hover:bg-[#166FE5] transition-colors flex justify-center items-center gap-2 shadow-sm"
          >
            Conectar con Facebook
          </button>

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Modo Desarrollo / Manual</h4>
            <p className="text-xs text-gray-400 mb-4">Si el Embedded Signup de Meta aún no está configurado, puedes ingresar los tokens manualmente desde el panel de Meta for Developers.</p>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Access Token Permanente"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number ID"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={devPhoneId}
                onChange={(e) => setDevPhoneId(e.target.value)}
              />
              <input
                type="text"
                placeholder="WABA ID (Business Account ID)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={devWabaId}
                onChange={(e) => setDevWabaId(e.target.value)}
              />
              <button
                onClick={handleSaveDevCredentials}
                disabled={!devToken || !devPhoneId || !devWabaId}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
