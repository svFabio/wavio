import { Building2, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingViewProps {
    nombre: string;
    onNombreChange: (value: string) => void;
    error: string | null;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export const OnboardingView = ({
    nombre,
    onNombreChange,
    error,
    loading,
    onSubmit,
}: OnboardingViewProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gradient-dark-from via-gradient-dark-via to-gradient-dark-to font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-surface-dark-glass backdrop-blur-xl rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
                    <div className="px-8 pt-10 pb-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary text-white mb-6 shadow-lg shadow-primary/30">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenido!</h1>
                        <p className="text-txt-muted mt-2 text-sm">
                            Cuentanos un poco sobre tu negocio para comenzar.
                        </p>
                    </div>

                    <div className="px-8 pb-10">
                        <form onSubmit={onSubmit} className="space-y-5">
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
                                    onChange={(e) => onNombreChange(e.target.value)}
                                    placeholder="Ej: Samsara Spa, Barberia El Punto..."
                                    required
                                    className="w-full py-3 px-4 bg-surface-dark-input border border-border/50 rounded-xl text-white text-sm placeholder:text-txt-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
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
