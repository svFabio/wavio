import { useState, useEffect, useMemo } from 'react';
import { useCitas } from '../hooks/useCitas';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { io } from 'socket.io-client';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Phone,
  X,
  User,
  Timer,
  Plus,
  Loader2,
  Sparkles,
  Globe,
  Building2,
  FileText,
  Save
} from 'lucide-react';
import { api } from '../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../index.css'; // Asegura cargar los estilos

// --- 1. Configuración Regional ---
const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// --- 2. Interfaces ---
interface RecursoEvento {
  estado?: string;
  telefono?: string;
  tipo?: 'resumen' | 'cita';
  count?: number;
  servicio?: string;
  origen?: string;
  descripcion?: string;
  citaId?: string;
}

interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: RecursoEvento;
}

// --- 3. Componente MODAL DETALLE ---
const ModalDetalle = ({
  event,
  onClose,
  onReprogramar,
  onNoAsistio
}: {
  event: EventoCalendario | null,
  onClose: () => void,
  onReprogramar: () => void,
  onNoAsistio: () => void
}) => {
  const [descripcion, setDescripcion] = useState(event?.resource?.descripcion || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  if (!event) return null;

  const getStatusBadge = (estado?: string) => {
    switch (estado) {
      case 'CONFIRMADA': return 'badge-success';
      case 'VALIDAR': return 'badge-warning';
      case 'PENDIENTE_PAGO': return 'badge-info';
      case 'NO_ASISTIO': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const statusClass = getStatusBadge(event.resource?.estado);
  const esPresencial = event.resource?.origen === 'presencial';

  const guardarDescripcion = async () => {
    if (!event.resource?.citaId) return;
    setGuardando(true);
    const result = await api.actualizarDescripcion(event.resource.citaId, descripcion);
    setGuardando(false);
    if (result.success) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-sm overflow-hidden animate-modal-pop shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/50">
          <h3 className="font-bold text-lg text-txt">Detalles de la Cita</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors text-txt-muted hover:text-txt hover:rotate-90 duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 bg-surface">
          {/* Cliente */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Cliente</p>
              <p className="font-bold text-txt text-base leading-tight">{event.title}</p>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center text-success shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Teléfono</p>
              <p className="font-medium text-txt text-sm">{event.resource?.telefono || 'No registrado'}</p>
            </div>
          </div>

          {/* Servicio */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center text-secondary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Servicio</p>
              <p className="font-medium text-txt">{event.resource?.servicio || 'Spa'}</p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-info-light flex items-center justify-center text-info shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Horario</p>
              <p className="font-medium text-txt text-sm">
                {format(event.start, 'EEEE d MMMM, yyyy', { locale: es })}
                <br />
                <span className="text-lg font-bold text-txt">
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </span>
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {esPresencial ? (
              <span className="badge badge-warning gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Presencial
              </span>
            ) : (
              <span className="badge badge-info gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Virtual
              </span>
            )}

            <div className={`badge ${statusClass} gap-1.5`}>
              {event.resource?.estado === 'CONFIRMADA' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {event.resource?.estado === 'VALIDAR' && <AlertCircle className="w-3.5 h-3.5" />}
              {event.resource?.estado === 'PENDIENTE_PAGO' && <Banknote className="w-3.5 h-3.5" />}
              {event.resource?.estado}
            </div>
          </div>

          {/* Descripción editable */}
          {event.resource?.tipo === 'cita' && (
            <div className="space-y-2 pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-txt-muted" />
                <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider">Notas del Admin</p>
              </div>
              <div className="relative">
                <textarea
                  value={descripcion}
                  onChange={(e) => { setDescripcion(e.target.value); setGuardado(false); }}
                  className="input-modern text-sm resize-none min-h-[48px]"
                  placeholder="Agregar notas privadas..."
                />
                <button
                  onClick={guardarDescripcion}
                  disabled={guardando}
                  className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-surface-elevated text-txt-secondary rounded-md hover:bg-surface-alt transition-all flex items-center gap-1 disabled:opacity-50 border border-border pointer-events-auto"
                >
                  {guardando ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : guardado ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-elevated border-t border-border flex flex-col gap-3">
          <div className="flex gap-3">
            {event.resource?.tipo === 'cita' && (
              <button
                onClick={onReprogramar}
                className="btn-secondary w-full flex-1"
              >
                Reprogramar
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary w-full flex-1 bg-white hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          {event.resource?.tipo === 'cita' && event.start < new Date() && event.resource?.estado !== 'CANCELADA' && (
            <button
              onClick={onNoAsistio}
              className={`w-full py-2.5 border rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${event.resource?.estado === 'NO_ASISTIO'
                ? 'border-success text-success bg-success-light/20 hover:bg-success-light/40'
                : 'border-danger/30 text-danger bg-danger-light/20 hover:bg-danger-light/40'
                }`}
            >
              {event.resource?.estado === 'NO_ASISTIO' ? (
                <><CheckCircle2 className="w-4 h-4" /> Marcar como Asistió</>
              ) : (
                <><X className="w-4 h-4" /> Marcar No Asistió</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 3.5 Componente MODAL NUEVA CITA ---
interface DatosNuevaCita {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
}

const ModalNuevaCita = ({
  isOpen,
  onClose,
  fechaInicial,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  fechaInicial?: Date;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState<DatosNuevaCita>({
    clienteNombre: '',
    clienteTelefono: '',
    fecha: fechaInicial ? format(fechaInicial, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    horario: ''
  });
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formData.fecha) {
      cargarHorarios(formData.fecha);
    }
  }, [isOpen, formData.fecha]);

  useEffect(() => {
    if (isOpen && fechaInicial) {
      setFormData(prev => ({
        ...prev,
        fecha: format(fechaInicial, 'yyyy-MM-dd'),
        horario: ''
      }));
    }
  }, [isOpen, fechaInicial]);

  const cargarHorarios = async (fecha: string) => {
    setLoadingHorarios(true);
    const horarios = await api.obtenerHorariosDisponibles(fecha);
    setHorariosDisponibles(horarios);
    setLoadingHorarios(false);
    if (!horarios.includes(formData.horario)) {
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.clienteNombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (formData.clienteTelefono.length < 8) {
      setError('El teléfono debe tener al menos 8 dígitos.');
      return;
    }

    setLoading(true);
    const result = await api.crearCitaAdmin(formData);
    setLoading(false);

    if (result.success) {
      setFormData({ clienteNombre: '', clienteTelefono: '', fecha: format(new Date(), 'yyyy-MM-dd'), horario: '' });
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Error al crear la cita');
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({ clienteNombre: '', clienteTelefono: '', fecha: format(new Date(), 'yyyy-MM-dd'), horario: '' });
    onClose();
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, clienteTelefono: valor }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nueva Cita
          </h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors">
            <X className="w-5 h-5 text-txt-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Nombre del Cliente *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="text"
                required
                value={formData.clienteNombre}
                onChange={(e) => setFormData(prev => ({ ...prev, clienteNombre: e.target.value }))}
                className="input-modern pl-10"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Teléfono *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="tel"
                required
                value={formData.clienteTelefono}
                onChange={handleTelefonoChange}
                className="input-modern pl-10"
                placeholder="Ej: 591 70000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">Fecha *</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input-modern pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Horario *</label>
            {loadingHorarios ? (
              <div className="flex items-center justify-center py-4 text-txt-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando horarios...
              </div>
            ) : horariosDisponibles.length === 0 ? (
              <div className="p-3 bg-warning-light border border-warning/20 rounded-xl text-warning-dark text-sm">
                No hay horarios disponibles hoy
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {horariosDisponibles.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, horario: h }))}
                    className={`py-2 px-1 rounded-lg font-semibold text-xs transition-all ${formData.horario === h
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                      : 'bg-surface-elevated text-txt-secondary hover:bg-border-light'
                      }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.horario}
              className="btn-primary flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MODAL REPROGRAMAR ---
const ModalReprogramar = ({
  isOpen,
  onClose,
  cita,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  cita: EventoCalendario;
  onSuccess: () => void;
}) => {
  const [fecha, setFecha] = useState(format(cita.start, 'yyyy-MM-dd'));
  const [horario, setHorario] = useState(format(cita.start, 'HH:mm'));
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarHorarios(fecha);
    }
  }, [isOpen, fecha]);

  const cargarHorarios = async (fechaSel: string) => {
    setLoadingHorarios(true);
    const horarios = await api.obtenerHorariosDisponibles(fechaSel);
    setHorariosDisponibles(horarios);
    setLoadingHorarios(false);
    if (!horarios.includes(horario) && fechaSel !== format(cita.start, 'yyyy-MM-dd')) {
      setHorario('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await api.reprogramarCita(cita.id, fecha, horario);
    setLoading(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Error al reprogramar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Reprogramar Cita
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors">
            <X className="w-5 h-5 text-txt-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-surface-elevated rounded-xl text-sm border border-border">
            <p className="font-bold text-txt-muted text-[10px] uppercase mb-1 tracking-wider">Cita Actual</p>
            <p className="font-bold text-txt">{cita.title}</p>
            <p className="text-txt-secondary">{format(cita.start, 'EEEE d MMMM, HH:mm', { locale: es })}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Nueva Fecha</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="input-modern pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Nuevo Horario</label>
            {loadingHorarios ? (
              <div className="flex items-center justify-center py-4 text-txt-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando espacios...
              </div>
            ) : horariosDisponibles.length === 0 ? (
              <div className="p-3 bg-warning-light border border-warning/20 rounded-xl text-warning-dark text-sm">
                No hay horarios disponibles para esta fecha
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {horariosDisponibles.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorario(h)}
                    className={`py-2 px-1 rounded-lg font-semibold text-xs transition-all ${horario === h
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                      : 'bg-surface-elevated text-txt-secondary hover:bg-border-light'
                      }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !horario}
              className="btn-primary flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- 4. Componentes Visuales del Calendario ---
const CustomEventDay = ({ event }: { event: EventoCalendario }) => {
  const { title, resource } = event;

  const getDotColor = () => {
    switch (resource?.estado) {
      case 'CONFIRMADA': return 'bg-success';
      case 'VALIDAR': return 'bg-warning';
      case 'PENDIENTE_PAGO': return 'bg-info';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex flex-col justify-center h-full px-2 py-1 gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor()}`} />
        <span className="text-xs font-bold text-txt leading-tight truncate">
          {title}
        </span>
      </div>
      {resource?.servicio && (
        <span className="text-[11px] text-txt-secondary leading-tight pl-3.5 truncate">
          {resource.servicio}
        </span>
      )}
    </div>
  );
};

const CustomEventMonth = ({ event }: { event: EventoCalendario }) => {
  const count = event.resource?.count || 1;
  return (
    <>
      {/* Desktop: text label — centered in cell */}
      <span className="hidden md:inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-txt-secondary w-full">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 inline-block" />
        <span>{event.title}</span>
      </span>
      {/* Mobile: colored dots representing count */}
      <span className="md:hidden inline-flex items-center justify-center gap-0.5 w-full">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <span key={i} className="w-[6px] h-[6px] rounded-full bg-primary inline-block" />
        ))}
        {count > 4 && <span className="text-[9px] text-primary font-bold leading-none">+</span>}
      </span>
    </>
  );
};

interface CustomToolbarProps { onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void; onView: (view: View) => void; view: View; label: string; onNuevaCita: () => void; }
const CustomToolbar = ({ onNavigate, onView, view, label, onNuevaCita }: CustomToolbarProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-4 border-b border-border gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface p-1 rounded-xl border border-border shadow-sm">
          <button onClick={() => onNavigate('PREV')} className="p-1.5 hover:bg-surface-elevated rounded-lg text-txt-secondary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => onNavigate('TODAY')} className="px-3 py-1.5 text-xs font-bold text-txt hover:bg-surface-elevated rounded-lg mx-1 transition-colors uppercase tracking-wider">
            Hoy
          </button>
          <button onClick={() => onNavigate('NEXT')} className="p-1.5 hover:bg-surface-elevated rounded-lg text-txt-secondary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-txt capitalize font-sans tracking-tight">{label}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onNuevaCita}
          className="btn-primary shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Cita</span><span className="sm:hidden">Nueva</span>
        </button>

        <div className="flex bg-surface-elevated p-1 rounded-xl border border-border relative">
          <div
            className={`absolute top-1 bottom-1 rounded-lg bg-surface shadow-sm transition-all duration-300 ease-out border border-border/50 ${view === Views.MONTH ? 'left-1 w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'
              }`}
          />
          <button
            onClick={() => onView(Views.MONTH)}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === Views.MONTH ? 'text-primary' : 'text-txt-muted hover:text-txt'
              }`}
          >
            <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Mes</span>
          </button>
          <button
            onClick={() => onView(Views.DAY)}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === Views.DAY ? 'text-primary' : 'text-txt-muted hover:text-txt'
              }`}
          >
            <Clock className="w-4 h-4" /> <span className="hidden sm:inline">Día</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 5. Componente Principal ---
const Calendario = () => {
  const { data: dataRaw = [], isLoading: loading } = useCitas();
  const queryClient = useQueryClient();

  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState<View>(Views.MONTH);
  const [citaSeleccionada, setCitaSeleccionada] = useState<EventoCalendario | null>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<{ isOpen: boolean; fecha?: Date }>({ isOpen: false });
  const [modalReprogramar, setModalReprogramar] = useState<{ isOpen: boolean; cita?: EventoCalendario }>({ isOpen: false });

  // Scroll hasta la primera cita del dia visible (o 08:00 si no hay ninguna)
  const scrollToTime = useMemo(() => {
    if (vista !== Views.DAY) return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const citasDelDia = dataRaw.filter(c => {
      const d = c.fecha.toString().split('T')[0];
      const fechaStr = format(fecha, 'yyyy-MM-dd');
      return d === fechaStr;
    });
    if (citasDelDia.length === 0) return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const horaMin = citasDelDia.reduce((min, c) => {
      const [h, m] = c.horario.split(':').map(Number);
      return h * 60 + m < min ? h * 60 + m : min;
    }, Infinity);
    const h = Math.floor(horaMin / 60);
    const m = horaMin % 60;
    // Scroll un poco antes para dar contexto visual
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), Math.max(0, h - 1), m, 0);
  }, [fecha, vista, dataRaw]);

  const abrirModalNuevaCita = (fechaPreseleccionada?: Date) => {
    setModalNuevaCita({ isOpen: true, fecha: fechaPreseleccionada });
  };

  useEffect(() => {
    const urlBase = import.meta.env.VITE_API_URL.replace('/api', '');
    const socket = io(urlBase);
    socket.on('cambio-citas', () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    });
    return () => { socket.disconnect(); };
  }, [queryClient]);

  const eventos = useMemo((): EventoCalendario[] => {
    if (loading && dataRaw.length === 0) return [];
    if (vista === Views.MONTH) {
      const countByDate: Record<string, number> = {};
      dataRaw.forEach(c => {
        const d = c.fecha.toString().split('T')[0];
        countByDate[d] = (countByDate[d] || 0) + 1;
      });
      return Object.entries(countByDate).map(([dateStr, count]) => {
        const start = new Date(`${dateStr}T00:00:00`);
        return {
          id: `sum-${dateStr}`,
          title: `${count} cita${count > 1 ? 's' : ''}`,
          start,
          end: new Date(start),
          allDay: true,
          resource: { tipo: 'resumen' as const, estado: 'INFO', count: count }
        };
      });
    }
    return dataRaw.map(cita => {
      const datePart = cita.fecha.toString().split('T')[0];
      const start = new Date(`${datePart}T${cita.horario}:00`);
      return {
        id: cita.id.toString(),
        title: cita.clienteNombre || `Cita sin nombre`,
        start,
        end: new Date(start.getTime() + 60 * 60000),
        resource: {
          tipo: 'cita' as const,
          estado: cita.estado,
          telefono: cita.clienteTelefono,
          servicio: cita.servicio || 'Spa',
          origen: cita.origen || 'virtual',
          descripcion: cita.descripcion || '',
          citaId: cita.id.toString()
        }
      };
    });
  }, [dataRaw, vista, loading]);

  const eventStyleGetter = (event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      return {
        className: 'rbc-event-clean',
        style: { backgroundColor: 'transparent', color: 'inherit', border: 'none', boxShadow: 'none', padding: 0, outline: 'none' }
      };
    }
    let bg = 'var(--color-surface)';
    let border = 'var(--color-border)';

    switch (event.resource?.estado) {
      case 'CONFIRMADA': border = 'var(--color-success)'; bg = 'var(--color-success-light)'; break;
      case 'VALIDAR': border = 'var(--color-warning)'; bg = 'var(--color-warning-light)'; break;
      case 'PENDIENTE_PAGO': border = 'var(--color-info)'; bg = 'var(--color-info-light)'; break;
      case 'NO_ASISTIO': border = 'var(--color-danger)'; bg = 'var(--color-danger-light)'; break;
    }

    return {
      className: 'shadow-sm rounded-md border-l-4',
      style: { backgroundColor: bg, borderColor: border, color: 'var(--color-text)', fontSize: '0.8rem' }
    };
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (vista === Views.MONTH) {
      setFecha(start);
      setVista(Views.DAY);
    } else {
      abrirModalNuevaCita(start);
    }
  };

  const handleSelectEvent = (event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      setFecha(event.start);
      setVista(Views.DAY);
    } else {
      setCitaSeleccionada(event);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 p-4">
      <div className="card-modern h-full p-4 flex flex-col shadow-xl">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 220px)' }}
          view={vista}
          onView={setVista}
          date={fecha}
          onNavigate={setFecha}
          culture='es'
          min={new Date(2026, 0, 1, 8, 0, 0)}
          max={new Date(2026, 0, 1, 20, 0, 0)}
          scrollToTime={scrollToTime}
          components={{
            event: vista === Views.MONTH ? CustomEventMonth : CustomEventDay,
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                onNuevaCita={() => abrirModalNuevaCita()}
              />
            )
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          selectable
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay citas en este rango',
          }}
        />
      </div>

      {modalNuevaCita.isOpen && (
        <ModalNuevaCita
          isOpen={modalNuevaCita.isOpen}
          onClose={() => setModalNuevaCita({ isOpen: false })}
          fechaInicial={modalNuevaCita.fecha}
          onSuccess={() => { }}
        />
      )}

      {citaSeleccionada && (
        <ModalDetalle
          event={citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onReprogramar={() => {
            setModalReprogramar({ isOpen: true, cita: citaSeleccionada });
            setCitaSeleccionada(null);
          }}
          onNoAsistio={async () => {
            const citaId = citaSeleccionada.resource?.citaId;
            if (!citaId) return;
            const esNoAsistio = citaSeleccionada.resource?.estado === 'NO_ASISTIO';
            const result = esNoAsistio
              ? await api.marcarAsistio(citaId)
              : await api.marcarNoAsistio(citaId);
            if (result.success) {
              queryClient.invalidateQueries({ queryKey: ['citas'] });
            }
            setCitaSeleccionada(null);
          }}
        />
      )}

      {modalReprogramar.isOpen && modalReprogramar.cita && (
        <ModalReprogramar
          isOpen={modalReprogramar.isOpen}
          onClose={() => setModalReprogramar({ isOpen: false })}
          cita={modalReprogramar.cita}
          onSuccess={() => { }}
        />
      )}
    </div>
  );
};

export default Calendario;