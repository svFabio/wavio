import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { getSocket } from '../lib/socket';
import type { MensajeChat, Conversacion } from '../types';
import {
    Send,
    MessageCircle,
    ArrowLeft,
    Phone,
    Search,
    Loader2,
    WifiOff,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Chat = () => {
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
    const [selectedJid, setSelectedJid] = useState<string | null>(null);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loadingMensajes, setLoadingMensajes] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversacionesQuery = useQuery({
        queryKey: ['conversaciones'],
        queryFn: () => api.obtenerConversaciones(),
    });

    const loading = conversacionesQuery.isLoading;

    useEffect(() => {
        if (conversacionesQuery.data) {
            setConversaciones(conversacionesQuery.data);
        }
    }, [conversacionesQuery.data]);

    useEffect(() => {
        const handleNuevoMensaje = (msg: MensajeChat) => {
            setMensajes(prev => {
                if (prev.length > 0 && prev[0]?.remoteJid === msg.remoteJid) {
                    return [...prev, msg];
                }
                return prev;
            });

            setConversaciones(prev => {
                const existente = prev.find(c => c.remoteJid === msg.remoteJid);
                if (existente) {
                    return prev.map(c =>
                        c.remoteJid === msg.remoteJid
                            ? { ...c, ultimoContenido: msg.contenido, ultimoMensaje: msg.timestamp, ultimaDireccion: msg.direccion, totalMensajes: c.totalMensajes + 1 }
                            : c
                    ).sort((a, b) => new Date(b.ultimoMensaje).getTime() - new Date(a.ultimoMensaje).getTime());
                } else {
                    return [{
                        remoteJid: msg.remoteJid,
                        ultimoMensaje: msg.timestamp,
                        totalMensajes: 1,
                        ultimoContenido: msg.contenido,
                        ultimaDireccion: msg.direccion
                    }, ...prev];
                }
            });
        };

        const handleConversacionEliminada = ({ remoteJid }: { remoteJid: string }) => {
            setConversaciones(prev => prev.filter(c => c.remoteJid !== remoteJid));
            setSelectedJid(prev => prev === remoteJid ? null : prev);
        };

        const s = getSocket();
        s.on('nuevo-mensaje', handleNuevoMensaje);
        s.on('conversacion-eliminada', handleConversacionEliminada);

        return () => {
            s.off('nuevo-mensaje', handleNuevoMensaje);
            s.off('conversacion-eliminada', handleConversacionEliminada);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const abrirConversacion = async (jid: string) => {
        setSelectedJid(jid);
        setLoadingMensajes(true);
        const data = await api.obtenerMensajes(jid);
        setMensajes(data);
        setLoadingMensajes(false);
    };

    const enviarMensaje = async () => {
        if (!selectedJid || !nuevoMensaje.trim() || enviando) return;
        setEnviando(true);
        const result = await api.enviarMensajeChat(selectedJid, nuevoMensaje.trim());
        setEnviando(false);
        if (result.success) {
            setNuevoMensaje('');
        }
    };

    const handleDeleteConversacion = async (e: React.MouseEvent, jid: string) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta conversación y todos sus mensajes de la base de datos?')) return;
        const result = await api.eliminarConversacion(jid);
        if (result.success) {
            setConversaciones(prev => prev.filter(c => c.remoteJid !== jid));
            if (selectedJid === jid) setSelectedJid(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const formatJid = (jid: string) => jid.split('@')[0];
    const formatTimestamp = (ts: string) => { try { return format(new Date(ts), 'HH:mm', { locale: es }); } catch { return ''; } };
    const formatDate = (ts: string) => { try { return format(new Date(ts), 'dd MMM, HH:mm', { locale: es }); } catch { return ''; } };

    const conversacionesFiltradas = conversaciones.filter(c =>
        formatJid(c.remoteJid).includes(busqueda) ||
        (c.clienteNombre ?? '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="h-[calc(100dvh-80px)] flex bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Panel Izquierdo */}
            <div className={`${selectedJid ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-border bg-surface`}>
                <div className="px-4 py-4 border-b border-border bg-surface">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="font-semibold text-txt text-sm">Chats de WhatsApp</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="input-modern pl-9"
                            placeholder="Buscar por nombre o numero..."
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="space-y-1 p-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                    <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-3.5 w-3/5 rounded" />
                                        <div className="skeleton h-2.5 w-4/5 rounded" />
                                    </div>
                                    <div className="skeleton h-2.5 w-10 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : conversacionesFiltradas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-txt-muted gap-2">
                            <WifiOff className="w-8 h-8 opacity-50" />
                            <p className="text-sm">No hay conversaciones aun</p>
                        </div>
                    ) : (
                        conversacionesFiltradas.map(conv => (
                            <button
                                key={conv.remoteJid}
                                onClick={() => abrirConversacion(conv.remoteJid)}
                                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-alt transition-colors border-b border-border-light text-left group
                                    ${selectedJid === conv.remoteJid
                                        ? 'bg-primary-light border-l-2 border-l-primary'
                                        : 'border-l-2 border-l-transparent'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {(conv.clienteNombre ?? formatJid(conv.remoteJid)).slice(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-txt text-sm truncate block">
                                        {conv.clienteNombre ?? formatJid(conv.remoteJid)}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Phone className="w-2.5 h-2.5 text-txt-muted shrink-0" />
                                        <span className="text-[10px] text-txt-muted font-mono truncate">{conv.telefonoReal || formatJid(conv.remoteJid)}</span>
                                    </div>
                                    <p className="text-xs text-txt-secondary mt-1 truncate">
                                        {conv.ultimaDireccion === 'SALIENTE' && <span className="text-primary font-bold">{'\u2713\u2713 '} </span>}
                                        {conv.ultimoContenido}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-[10px] text-txt-muted">{formatDate(conv.ultimoMensaje)}</span>
                                    <button
                                        onClick={(e) => handleDeleteConversacion(e, conv.remoteJid)}
                                        title="Eliminar conversación"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-danger/60 hover:text-danger hover:bg-danger-light"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Panel Derecho — Mensajes */}
            <div className={`${selectedJid ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-surface-alt relative`}>
                {selectedJid ? (
                    <>
                        <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-3">
                            <button
                                onClick={() => setSelectedJid(null)}
                                className="md:hidden p-1.5 hover:bg-surface-elevated rounded-full text-txt-muted transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                                {conversaciones.find(c => c.remoteJid === selectedJid)?.clienteNombre?.slice(0, 2).toUpperCase() ?? formatJid(selectedJid).slice(-2)}
                            </div>
                            <div className="flex-1">
                                <p className="text-txt font-semibold text-sm">
                                    {conversaciones.find(c => c.remoteJid === selectedJid)?.clienteNombre ?? formatJid(selectedJid)}
                                </p>
                                <p className="text-txt-muted text-xs flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {conversaciones.find(c => c.remoteJid === selectedJid)?.telefonoReal || formatJid(selectedJid)}
                                </p>
                            </div>
                        </div>

                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        >
                            {loadingMensajes ? (
                                <div className="space-y-4 p-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`skeleton rounded-2xl ${i % 2 === 0 ? 'w-3/5 h-10' : 'w-2/5 h-8'}`} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                mensajes.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direccion === 'SALIENTE' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm
                                            ${msg.direccion === 'SALIENTE'
                                                ? 'bg-primary text-white rounded-tr-sm'
                                                : 'bg-surface text-txt rounded-tl-sm border border-border'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.contenido}</p>
                                            <div className={`flex items-center gap-1 mt-1 ${msg.direccion === 'SALIENTE' ? 'justify-end text-white/70' : 'text-txt-muted'}`}>
                                                <span className="text-[10px]">{formatTimestamp(msg.timestamp)}</span>
                                                {msg.direccion === 'SALIENTE' && <span className="text-xs">{'\u2713\u2713'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="px-4 py-3 bg-surface border-t border-border">
                            <div className="flex items-end gap-2 relative">
                                <textarea
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1 input-modern pl-4 pr-12 py-3 resize-none max-h-32"
                                    rows={1}
                                    placeholder="Escribe un mensaje..."
                                    disabled={enviando}
                                />
                                <button
                                    onClick={enviarMensaje}
                                    disabled={!nuevoMensaje.trim() || enviando}
                                    className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-40 disabled:scale-95 shadow-md"
                                >
                                    {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-txt-muted">
                        <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-txt-muted/50" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-txt">Selecciona una conversación</h3>
                            <p className="text-xs text-txt-muted mt-1">Los mensajes de WhatsApp aparecerán aquí</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
