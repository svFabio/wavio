import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

const Onboarding = () => {
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || nombre.trim().length < 2) {
            setError('El nombre debe tener al menos 2 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/negocio/configurar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre: nombre.trim() })
            });

            if (!res.ok) throw new Error('Error al configurar el negocio');
            navigate('/dashboard', { replace: true });
        } catch {
            // Si no existe el endpoint aún, igualmente redirigimos al dashboard
            navigate('/dashboard', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
                    <div className="px-8 pt-10 pb-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary text-white mb-6 shadow-lg shadow-primary/30">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">¡Bienvenido!</h1>
                        <p className="text-txt-muted mt-2 text-sm">
                            Cuéntanos un poco sobre tu negocio para comenzar.
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-txt-muted mb-2 uppercase tracking-wider">
                                    Nombre de tu negocio
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Samsara Spa, Barbería El Punto..."
                                    required
                                    className="w-full py-3 px-4 bg-slate-900/50 border border-border/50 rounded-xl text-white text-sm placeholder:text-txt-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary hover:to-primary-dark text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                                ) : (
                                    <>Comenzar <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
