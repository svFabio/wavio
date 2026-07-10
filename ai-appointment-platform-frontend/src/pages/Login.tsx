import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

type Tab = 'login' | 'register';

export default function Login() {
    const [tab, setTab] = useState<Tab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

    interface LoginResponse { token: string; usuario: Parameters<typeof login>[1]; negocio: Parameters<typeof login>[2]; esNuevo?: boolean; }
    const handleSuccess = (data: LoginResponse) => {
        login(data.token, data.usuario, data.negocio);
        navigate(data.esNuevo ? '/onboarding' : from, { replace: true });
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = tab === 'login'
                ? await api.login(email, password)
                : await api.register(email, password);
            handleSuccess(data);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // useGoogleLogin con flow implicit da access_token
    // Lo enviamos al backend para completar el login
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError(null);
            setLoading(true);
            try {
                // Obtenemos el perfil del usuario con el access_token
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoRes.json();

                // Enviamos el access_token al backend (necesitamos actualizar el endpoint)
                const resp = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        googleToken: tokenResponse.access_token,
                        userInfo   // sub, name, email, picture
                    })
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Error al autenticar con Google');
                handleSuccess(data);
            } catch (err: unknown) {
                setError((err as Error).message || 'Error al iniciar sesión con Google');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Error al conectar con Google. Inténtalo de nuevo.'),
    });

    const switchTab = (t: Tab) => { setTab(t); setError(null); setEmail(''); setPassword(''); };

    const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all duration-200";

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">

            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white text-xl mb-4 shadow-lg shadow-indigo-200">
                        💬
                    </div>
                    <h1 className="text-gray-900 text-2xl font-bold tracking-tight">CitasWA</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {tab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratis'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['login', 'register'] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => switchTab(t)}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Google button */}
                    <button
                        type="button"
                        onClick={() => googleLogin()}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl py-3 text-sm font-medium text-gray-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Google SVG logo */}
                        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                            <path d="M47.532 24.552c0-1.636-.147-3.2-.404-4.704H24.48v9.02h12.956c-.568 2.952-2.24 5.42-4.74 7.08v5.908h7.664c4.484-4.136 7.172-10.228 7.172-17.304z" fill="#4285F4" />
                            <path d="M24.48 48c6.48 0 11.916-2.148 15.876-5.844l-7.664-5.908c-2.148 1.44-4.892 2.292-8.212 2.292-6.312 0-11.664-4.264-13.572-9.996H2.956v6.096C6.9 42.9 15.12 48 24.48 48z" fill="#34A853" />
                            <path d="M10.908 28.544A14.447 14.447 0 0 1 10.08 24c0-1.576.276-3.104.828-4.544v-6.096H2.956A23.964 23.964 0 0 0 .48 24c0 3.876.932 7.548 2.476 10.64l8.436-6.096H10.908z" fill="#FBBC05" />
                            <path d="M24.48 9.46c3.552 0 6.74 1.224 9.248 3.612l6.908-6.908C36.392 2.148 30.96 0 24.48 0 15.12 0 6.9 5.1 2.956 13.36l8.436 6.096c1.908-5.732 7.26-9.996 13.088-9.996z" fill="#EA4335" />
                        </svg>
                        Continuar con Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <hr className="flex-1 border-gray-100" />
                        <span className="text-xs text-gray-300">o con email</span>
                        <hr className="flex-1 border-gray-100" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                            autoComplete="email"
                            className={inputClass}
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                required
                                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                className={`${inputClass} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-px active:translate-y-0"
                        >
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Cargando...</>
                                : tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
                            }
                        </button>
                    </form>

                    {tab === 'register' && (
                        <p className="text-center text-xs text-gray-400">
                            Luego podrás ponerle nombre a tu negocio ✨
                        </p>
                    )}
                </div>

                <p className="text-center text-xs text-gray-300 mt-6">
                    © {new Date().getFullYear()} CitasWA
                </p>
            </div>
        </div>
    );
}
