import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type MetodoVinculacion = 'qr' | 'codigo';

interface WhatsappStatus {
  conectado: boolean;
  qr: string | null;
  activo: boolean;
}

const AdminWhatsapp = () => {
  const [status, setStatus] = useState<WhatsappStatus>({ conectado: false, qr: null, activo: false });
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [metodo, setMetodo] = useState<MetodoVinculacion>('qr');
  const [telefono, setTelefono] = useState('');
  const [codigoPairing, setCodigoPairing] = useState<string | null>(null);
  const [errorPairing, setErrorPairing] = useState<string | null>(null);
  const { negocio } = useAuth();

  const fetchStatus = async () => {
    try {
      const data = await api.statusWhatsapp();
      if (data) setStatus(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = async () => {
    setProcesando(true);
    setLoading(true);
    try {
      const res = await api.iniciarBot();
      if (res?.error) alert(res.error);
      else await fetchStatus();
    } catch {
      alert('Error al iniciar el bot');
    } finally {
      setProcesando(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Desvincular el bot de WhatsApp?')) return;
    setProcesando(true);
    try {
      await api.logoutBot();
      setStatus({ conectado: false, qr: null, activo: false });
      setCodigoPairing(null);
    } catch {
      alert('Error al desconectar');
    } finally {
      setProcesando(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setCodigoPairing(null);
    try {
      await api.reiniciarBot();
    } catch {
      alert('Error al reiniciar el bot');
      setLoading(false);
    }
  };

  const handleSolicitarCodigo = async () => {
    if (!telefono.trim()) return;
    setErrorPairing(null);
    setCodigoPairing(null);
    setProcesando(true);
    try {
      const res = await api.solicitarCodigoPairing(telefono.trim());
      setCodigoPairing(res.codigo);
    } catch (err: any) {
      setErrorPairing(err.message || 'Error al solicitar el codigo');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const urlBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
    const socket = io(urlBase, { transports: ['websocket', 'polling'] });

    const eventName = negocio?.id ? `whatsapp-status-${negocio.id}` : 'whatsapp-status';
    socket.on(eventName, (data: WhatsappStatus) => {
      setStatus(data);
      setLoading(false);
      if (data.conectado) setCodigoPairing(null);
    });

    const intervalo = setInterval(fetchStatus, 6000);
    return () => { socket.disconnect(); clearInterval(intervalo); };
  }, [negocio?.id]);

  // --- Estado: cargando ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-gray-500 text-sm">Cargando estado...</p>
      </div>
    );
  }

  // --- Estado: conectado ---
  if (status.conectado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl font-bold">
          ✓
        </div>
        <h3 className="text-lg font-bold text-gray-800">Bot operativo</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          El sistema esta escuchando mensajes de WhatsApp correctamente.
        </p>
        <button
          onClick={handleLogout}
          disabled={procesando}
          className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {procesando ? 'Desconectando...' : 'Desvincular WhatsApp'}
        </button>
      </div>
    );
  }

  // --- Estado: no conectado ---
  return (
    <div className="flex flex-col items-center p-6 sm:p-8 gap-6 max-w-md mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-800 text-center">Vincular WhatsApp</h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Elige como conectar tu numero al bot
        </p>
      </div>

      {/* Selector de metodo */}
      <div className="w-full flex bg-gray-100 p-1 rounded-xl">
        {(['qr', 'codigo'] as MetodoVinculacion[]).map(m => (
          <button
            key={m}
            onClick={() => { setMetodo(m); setCodigoPairing(null); setErrorPairing(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${metodo === m
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {m === 'qr' ? 'Codigo QR' : 'Codigo de texto'}
          </button>
        ))}
      </div>

      {/* Contenido segun metodo */}
      {metodo === 'qr' ? (
        <div className="w-full flex flex-col items-center gap-4">
          {status.qr ? (
            <>
              <p className="text-sm text-gray-600 text-center">
                Abre WhatsApp en tu celular, ve a <strong>Dispositivos vinculados</strong> y escanea:
              </p>
              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <QRCode value={status.qr} size={200} />
              </div>
              <p className="text-xs text-gray-400 text-center">
                El QR se actualiza automaticamente. No lo compartas.
              </p>
            </>
          ) : status.activo ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm text-gray-600">Generando codigo QR...</p>
              <p className="text-xs text-gray-400 text-center">Si tarda mas de 10 segundos, reinicia.</p>
              <button
                onClick={handleRestart}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Reiniciar bot
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-gray-500">El bot no esta iniciado.</p>
              <button
                onClick={handleIniciar}
                disabled={procesando}
                className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {procesando ? 'Iniciando...' : 'Iniciar bot'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* METODO CODIGO DE TEXTO */
        <div className="w-full flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 leading-relaxed">
            <strong>Como funciona:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-blue-600">
              <li>Ingresa tu numero con codigo de pais</li>
              <li>Copia el codigo generado</li>
              <li>En WhatsApp: Dispositivos vinculados - Vincular con numero</li>
              <li>Ingresa el codigo</li>
            </ol>
          </div>

          {codigoPairing ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-600 text-center font-medium">
                Codigo generado. Ingresalo en WhatsApp:
              </p>
              <div className="px-8 py-5 bg-gray-900 rounded-2xl text-center">
                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-white">
                  {codigoPairing}
                </span>
              </div>
              <p className="text-xs text-gray-400 text-center">
                El codigo expira en algunos minutos. Si falla, solicita uno nuevo.
              </p>
              <button
                onClick={() => { setCodigoPairing(null); setTelefono(''); }}
                className="text-xs text-indigo-600 underline"
              >
                Solicitar nuevo codigo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {errorPairing && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                  {errorPairing}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Numero de telefono (con codigo de pais)
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej: 5491155443322"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Sin + ni espacios. Argentina: 54 + area + numero
                </p>
              </div>
              <button
                onClick={handleSolicitarCodigo}
                disabled={procesando || !telefono.trim()}
                className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {procesando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                  : 'Obtener codigo'
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWhatsapp;
