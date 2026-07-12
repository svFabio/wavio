import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { api } from '../services/api';

type Servicio = { nombre: string; precio: number };
type Horarios = Record<string, string[]>;

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_LABEL: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo',
};

type Tab = 'general' | 'servicios' | 'horarios';

interface ConfigData {
    id: number;
    trigger: string;
    mensajeBienvenida: string;
    mensajeConfirmacion: string;
    servicios: Servicio[];
    horarios: Record<string, string[]>;
    cobrarAdelanto: boolean;
    porcentajeAdelanto: number;
}

export default function ConfiguracionBot() {
    const [tab, setTab] = useState<Tab>('general');
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: config, isLoading: loading } = useQuery<ConfigData>({
        queryKey: ['configuracion'],
        queryFn: () => api.getConfiguracion(),
    });

    const [trigger, setTrigger] = useState('');
    const [mensajeBienvenida, setMensajeBienvenida] = useState('');
    const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cobrarAdelanto, setCobrarAdelanto] = useState(true);
    const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50);
    const [horariosTexto, setHorariosTexto] = useState<Record<string, string>>({
        lunes: '', martes: '', miercoles: '', jueves: '', viernes: '', sabado: '', domingo: '',
    });
    const [initialized, setInitialized] = useState(false);

    // Initialize form state from query data
    if (config && !initialized) {
        setTrigger(config.trigger);
        setMensajeBienvenida(config.mensajeBienvenida);
        setMensajeConfirmacion(config.mensajeConfirmacion);
        setServicios(Array.isArray(config.servicios) ? config.servicios : []);
        setCobrarAdelanto(config.cobrarAdelanto);
        setPorcentajeAdelanto(config.porcentajeAdelanto);
        const texto: Record<string, string> = {};
        DIAS.forEach(d => { texto[d] = ((config.horarios as Horarios)[d] ?? []).join(', '); });
        setHorariosTexto(texto);
        setInitialized(true);
    }

    const saveMutation = useMutation({
        mutationFn: () => {
            const horarios: Horarios = {};
            DIAS.forEach(dia => {
                horarios[dia] = (horariosTexto[dia] || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => /^\d{1,2}:\d{2}$/.test(s));
            });
            return api.updateConfiguracion({
                trigger, mensajeBienvenida, mensajeConfirmacion, servicios, horarios, cobrarAdelanto, porcentajeAdelanto
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configuracion'] });
        },
        onError: (e: Error) => {
            setError(e.message || 'Error guardando');
        },
    });

    const addServicio = () => setServicios(s => [...s, { nombre: '', precio: 0 }]);
    const removeServicio = (i: number) => setServicios(s => s.filter((_, idx) => idx !== i));
    const updateServicio = (i: number, field: keyof Servicio, value: string | number) =>
        setServicios(s => s.map((svc, idx) => idx === i ? { ...svc, [field]: value } : svc));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-txt">Configuracion del Bot</h1>
                    <p className="text-sm text-txt-muted mt-0.5">Personaliza el flujo de conversacion de WhatsApp</p>
                </div>
                <button
                    onClick={() => {
                        setError(null);
                        saveMutation.mutate();
                    }}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saveMutation.isSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveMutation.isPending ? 'Guardando...' : saveMutation.isSuccess ? 'Guardado' : 'Guardar'}
                </button>
            </div>

            {error && (
                <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
            )}

            {/* Tabs */}
            <div className="flex bg-surface-elevated p-1 rounded-xl w-fit">
                {(['general', 'servicios', 'horarios'] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t ? 'bg-surface text-txt shadow-sm border border-border' : 'text-txt-muted hover:text-txt'
                            }`}
                    >
                        {t === 'general' ? 'General' : t === 'servicios' ? 'Servicios' : 'Horarios'}
                    </button>
                ))}
            </div>

            {/* ── General ── */}
            {tab === 'general' && (
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                            Palabra o frase que activa el bot
                        </label>
                        <input
                            value={trigger}
                            onChange={e => setTrigger(e.target.value)}
                            placeholder="!cita"
                            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                        />
                        <p className="text-xs text-txt-muted mt-1.5">El cliente debe escribir esto exactamente para iniciar el proceso.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                            Mensaje de bienvenida
                        </label>
                        <textarea
                            value={mensajeBienvenida}
                            onChange={e => setMensajeBienvenida(e.target.value)}
                            rows={3}
                            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                        />
                        <p className="text-xs text-txt-muted mt-1.5">Se envia al activar el bot. Luego pide el nombre del cliente.</p>
                    </div>
                    {/* ── Pago ── */}
                    <div className="border border-border-light rounded-xl p-4 space-y-4">
                        <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Cobro de adelanto</p>

                        {/* Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-txt-secondary">Requerir adelanto de pago</p>
                                <p className="text-xs text-txt-muted mt-0.5">
                                    {cobrarAdelanto
                                        ? 'El bot pedira comprobante antes de confirmar la cita'
                                        : 'La cita se confirma automaticamente sin pago previo'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCobrarAdelanto(v => !v)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${cobrarAdelanto ? 'bg-primary' : 'bg-border'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${cobrarAdelanto ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Campos visibles solo cuando cobrarAdelanto = true */}
                        {cobrarAdelanto && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                                        Porcentaje de adelanto
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={porcentajeAdelanto}
                                            onChange={e => setPorcentajeAdelanto(Math.min(100, Math.max(1, Number(e.target.value))))}
                                            className="w-24 border border-border rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center font-mono"
                                        />
                                        <span className="text-sm text-txt-muted">% del precio del servicio</span>
                                    </div>
                                    <p className="text-xs text-txt-muted mt-1.5">
                                        Ej: si el servicio cuesta $100 y el adelanto es 30%, el cliente paga $30 primero.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5">
                                        Mensaje al recibir el comprobante
                                    </label>
                                    <textarea
                                        value={mensajeConfirmacion}
                                        onChange={e => setMensajeConfirmacion(e.target.value)}
                                        rows={3}
                                        className="w-full border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                    />
                                    <p className="text-xs text-txt-muted mt-1.5">Se envia al cliente cuando sube el comprobante de pago.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Servicios ── */}
            {tab === 'servicios' && (
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-4">
                    <p className="text-sm text-txt-muted">
                        El bot mostrara esta lista para que el cliente elija. El precio se muestra si es mayor a 0.
                    </p>
                    <div className="space-y-3">
                        {servicios.map((svc, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <input
                                    value={svc.nombre}
                                    onChange={e => updateServicio(i, 'nombre', e.target.value)}
                                    placeholder="Nombre del servicio"
                                    className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                                <div className="relative w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={svc.precio}
                                        onChange={e => updateServicio(i, 'precio', Number(e.target.value))}
                                        className="w-full border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => removeServicio(i)}
                                    className="p-2 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addServicio}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Agregar servicio
                    </button>
                </div>
            )}

            {/* ── Horarios ── */}
            {tab === 'horarios' && (
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-4">
                    <p className="text-sm text-txt-muted">
                        Escribe los horarios disponibles por dia separados por coma.
                        Formato: <span className="font-mono text-txt-secondary">09:00, 11:30, 15:00</span>
                    </p>
                    {DIAS.map(dia => (
                        <div key={dia} className="flex items-center gap-4">
                            <span className="w-24 shrink-0 text-sm font-semibold text-txt-secondary">{DIAS_LABEL[dia]}</span>
                            <input
                                value={horariosTexto[dia] ?? ''}
                                onChange={e => setHorariosTexto(t => ({ ...t, [dia]: e.target.value }))}
                                placeholder="09:00, 11:00, 14:30..."
                                className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-txt placeholder-txt-muted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    ))}
                    <p className="text-xs text-txt-muted pt-1">Los dias sin horarios no estaran disponibles para reservas.</p>
                </div>
            )}
        </div>
    );
}
