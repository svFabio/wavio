import { Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, Suspense, lazy } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { useSocketEvent } from './shared/hooks/useSocketEvent';

// NotificationToast is eagerly loaded — small component used on every page
import { NotificationToast } from './shared/components/NotificationToast';
const Pagos = lazy(() => import('./pages/Pagos'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Home = lazy(() => import('./pages/Home'));
const Vincular = lazy(() => import('./pages/Vincular'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Users = lazy(() => import('./pages/Users'));
const Chat = lazy(() => import('./pages/Chat'));
const Asistente = lazy(() => import('./pages/Asistente'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
import { useNotifications } from './shared/hooks/useNotifications';
import { playNotificationSound } from './utils/notificationSound';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleNuevaCita = useCallback(
    (data: { clienteNombre: string; clienteTelefono: string; fecha: string; horario: string }) => {
      const fechaFormateada = format(new Date(data.fecha), 'dd MMM yyyy', { locale: es });
      addNotification({
        message: `Nueva cita de ${data.clienteNombre}`,
        clienteNombre: data.clienteNombre,
        fecha: fechaFormateada,
        horario: data.horario,
      });
      playNotificationSound();
    },
    [addNotification],
  );

  useSocketEvent('nueva-cita', handleNuevaCita);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <div className="App min-h-[100dvh] bg-surface-alt">
            <div className="fixed md:bottom-4 md:right-4 top-4 left-0 right-0 md:left-auto md:top-auto md:w-auto w-full z-toast pointer-events-none flex flex-col items-center md:items-end px-4 md:px-0 gap-2">
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

            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <div className="skeleton w-48 h-8 rounded" />
                </div>
              }
            >
              <Routes>
                <Route
                  path="/login"
                  element={
                    <ErrorBoundary>
                      <Login />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Onboarding />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Dashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <ErrorBoundary>
                        <Home />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="calendario"
                    element={
                      <ErrorBoundary>
                        <Calendario />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="pagos"
                    element={
                      <ErrorBoundary>
                        <Pagos />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="chat"
                    element={
                      <ErrorBoundary>
                        <Chat />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="vincular"
                    element={
                      <ErrorBoundary>
                        <Vincular />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="statistics"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ErrorBoundary>
                          <Statistics />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ErrorBoundary>
                          <Users />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="asistente"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ErrorBoundary>
                          <Asistente />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="configuracion"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <ErrorBoundary>
                          <Configuracion />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route
                  path="*"
                  element={
                    <ErrorBoundary>
                      <div className="flex items-center justify-center min-h-screen bg-surface-alt">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-txt mb-2">404</h1>
                          <p className="text-txt-secondary mb-4">Pagina no encontrada</p>
                          <a
                            href="/dashboard"
                            className="bg-txt text-surface px-4 py-2 rounded-lg hover:bg-txt-secondary transition-colors"
                          >
                            Volver al Dashboard
                          </a>
                        </div>
                      </div>
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
