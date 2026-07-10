import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { io } from 'socket.io-client';
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
    const [loading, setLoading] = useState(true);
    const [loadingMensajes, setLoadingMensajes] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const cargarConversaciones = useCallback(async () => {
        const data = await api.obtenerConversaciones();
        setConversaciones(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        cargarConversaciones();
    }, [cargarConversaciones]);

    useEffect(() => {
        const urlBase = import.meta.env.VITE_API_URL.replace('/api', '');
        const socket = io(urlBase);

        socket.on('nuevo-mensaje', (msg: MensajeChat) => {
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
        });

        // Eliminar conversación en tiempo real cuando otro cliente la borra
        socket.on('conversacion-eliminada', ({ remoteJid }: { remoteJid: string }) => {
            setConversaciones(prev => prev.filter(c => c.remoteJid !== remoteJid));
            setSelectedJid(prev => prev === remoteJid ? null : prev);
        });

        return () => { socket.disconnect(); };
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
        e.stopPropagation(); // no abrir el chat
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
        <div className="h-[calc(100dvh-80px)] flex bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Panel Izquierdo */}
            <div className={`${selectedJid ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-border bg-surface`}>
                <div className="p-4 border-b border-border gradient-primary text-white">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" /> Chats de WhatsApp
                    </h2>
                    <div className="mt-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                            placeholder="Buscar por nombre o número..."
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
                            <p className="text-sm">No hay conversaciones aún</p>
                        </div>
                    ) : (
                        conversacionesFiltradas.map(conv => (
                            <button
                                key={conv.remoteJid}
                                onClick={() => abrirConversacion(conv.remoteJid)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-surface-elevated transition-colors border-b border-border-light text-left group ${selectedJid === conv.remoteJid ? 'bg-primary-light/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="w-12 h-12 rounded-full gradient-primary-subtle flex items-center justify-center text-primary font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                    {(conv.clienteNombre ?? formatJid(conv.remoteJid)).slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-txt text-sm truncate block">
                                        {conv.clienteNombre ?? formatJid(conv.remoteJid)}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Phone className="w-2.5 h-2.5 text-txt-muted shrink-0" />
                                        <span className="text-[10px] text-txt-muted font-mono truncate">{conv.telefonoReal || formatJid(conv.remoteJid)}</span>
                                    </div>
                                    <p className="text-xs text-txt-secondary mt-1 truncate">
                                        {conv.ultimaDireccion === 'SALIENTE' && <span className="text-primary font-bold">✓✓ </span>}
                                        {conv.ultimoContenido}
                                    </p>
                                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-surface-elevated text-txt-muted rounded-full">
                                        {conv.totalMensajes} msgs
                                    </span>
                                </div>
                                {/* Columna derecha: fecha arriba, trash abajo */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-[10px] text-txt-muted">{formatDate(conv.ultimoMensaje)}</span>
                                    <button
                                        onClick={(e) => handleDeleteConversacion(e, conv.remoteJid)}
                                        title="Eliminar conversación"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Panel Derecho */}
            <div className={`${selectedJid ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-surface-alt relative`}>
                {selectedJid ? (
                    <>
                        <div className="p-4 border-b border-border bg-white shadow-sm flex items-center gap-3 z-10">
                            <button onClick={() => setSelectedJid(null)} className="md:hidden p-1.5 hover:bg-surface-elevated rounded-full text-txt-secondary">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-md">
                                {conversaciones.find(c => c.remoteJid === selectedJid)?.clienteNombre?.slice(0, 2).toUpperCase() ?? formatJid(selectedJid).slice(-2)}
                            </div>
                            <div className="flex-1">
                                <p className="text-txt font-bold text-sm">
                                    {conversaciones.find(c => c.remoteJid === selectedJid)?.clienteNombre ?? formatJid(selectedJid)}
                                </p>
                                <p className="text-txt-muted text-xs flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {conversaciones.find(c => c.remoteJid === selectedJid)?.telefonoReal || formatJid(selectedJid)}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ backgroundImage: `radial-gradient(var(--color-border-light) 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
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
                                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm ${msg.direccion === 'SALIENTE'
                                            ? 'bg-primary text-white rounded-tr-sm'
                                            : 'bg-white text-txt rounded-tl-sm border border-border'
                                            }`}>
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.contenido}</p>
                                            <div className={`flex items-center gap-1 mt-1 ${msg.direccion === 'SALIENTE' ? 'justify-end text-white/80' : 'text-txt-muted'}`}>
                                                <span className="text-[10px]">{formatTimestamp(msg.timestamp)}</span>
                                                {msg.direccion === 'SALIENTE' && <span className="text-xs">✓✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-border">
                            <div className="flex items-end gap-2 relative">
                                <textarea
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="input-modern rounded-2xl pr-12 resize-none max-h-32 py-3"
                                    rows={1}
                                    placeholder="Escribe un mensaje..."
                                    disabled={enviando}
                                />
                                <button
                                    onClick={enviarMensaje}
                                    disabled={!nuevoMensaje.trim() || enviando}
                                    className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-primary/20"
                                >
                                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-txt-muted gap-4 opacity-50">
                        <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center">
                            <MessageCircle className="w-12 h-12 text-txt-muted" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-txt">Selecciona una conversación</h3>
                            <p className="text-sm">Los mensajes de WhatsApp aparecerán aquí</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
