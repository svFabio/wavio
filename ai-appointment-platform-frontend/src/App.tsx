import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Pagos from './pages/Pagos';
import Calendario from './pages/Calendario';
import Home from './pages/Home';
import Vincular from './pages/Vincular';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Statistics from './pages/Statistics';
import Users from './pages/Users';
import Chat from './pages/Chat';
import ConfiguracionBot from './pages/ConfiguracionBot';
import { NotificationToast } from './components/NotificationToast';
import { useNotifications } from './hooks/useNotifications';
import { playNotificationSound } from './utils/notificationSound';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const { notifications, addNotification, dismissNotification } = useNotifications();

  useEffect(() => {
    const urlBase = import.meta.env.VITE_API_URL.replace('/api', '');
    const socket = io(urlBase, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    interface NuevaCitaPayload { clienteNombre: string; clienteTelefono: string; fecha: string; horario: string; }
    socket.on('nueva-cita', (data: NuevaCitaPayload) => {
      const fechaFormateada = format(new Date(data.fecha), 'dd MMM yyyy', { locale: es });
      addNotification({
        message: `Nueva cita de ${data.clienteNombre}`,
        clienteNombre: data.clienteNombre,
        fecha: fechaFormateada,
        horario: data.horario
      });
      playNotificationSound();
    });

    return () => { socket.disconnect(); };
  }, [addNotification]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <div className="App min-h-[100dvh] bg-slate-50">
          {/* Toast de notificaciones */}
          <div className="fixed md:bottom-4 md:right-4 top-4 left-0 right-0 md:left-auto md:top-auto md:w-auto w-full z-[9999] pointer-events-none flex flex-col items-center md:items-end px-4 md:px-0 gap-2">
            <div className="pointer-events-auto w-full max-w-sm">
              {notifications.map((notif) => (
                <NotificationToast
                  key={notif.id}
                  id={notif.id}
                  clienteNombre={notif.clienteNombre}
                  fecha={notif.fecha}
                  horario={notif.horario}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          </div>

          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Ruta raíz */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard protegido */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="chat" element={<Chat />} />
              <Route path="vincular" element={<Vincular />} />

              {/* Solo ADMIN */}
              <Route path="statistics" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Statistics />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="configuracion-bot" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <ConfiguracionBot />
                </ProtectedRoute>
              } />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                  <p className="text-gray-600 mb-4">Página no encontrada</p>
                  <a href="/dashboard" className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                    Volver al Dashboard
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;