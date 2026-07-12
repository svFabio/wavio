import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  User,
  Phone,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Globe,
  Building2,
  FileText,
  Save,
  Loader2
} from 'lucide-react';
import { EventoCalendario } from '../types';

interface ModalDetalleProps {
  event: EventoCalendario | null;
  onClose: () => void;
  onReprogramar: () => void;
  onNoAsistio: () => void;
  onGuardarDescripcion: (citaId: string, descripcion: string) => Promise<{ success: boolean }>;
}

export const ModalDetalle = ({
  event,
  onClose,
  onReprogramar,
  onNoAsistio,
  onGuardarDescripcion
}: ModalDetalleProps) => {
  const [descripcion, setDescripcion] = useState(event?.resource?.descripcion || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const result = await onGuardarDescripcion(event.resource.citaId, descripcion);
      if (result.success) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } else {
        setError('No se pudo guardar la descripcion.');
      }
    } catch (err) {
      setError('Error de conexion al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-sm overflow-hidden animate-modal-pop shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/50">
          <h3 className="font-bold text-lg text-txt">Detalles de la Cita</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors text-txt-muted hover:text-txt hover:rotate-90 duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 bg-surface">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Cliente</p>
              <p className="font-bold text-txt text-base leading-tight">{event.title}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center text-success shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Telefono</p>
              <p className="font-medium text-txt text-sm">{event.resource?.telefono || 'No registrado'}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center text-secondary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-0.5">Servicio</p>
              <p className="font-medium text-txt">{event.resource?.servicio || 'Spa'}</p>
            </div>
          </div>

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
              {error && (
                <p className="text-xs text-danger mt-1">{error}</p>
              )}
            </div>
          )}
        </div>

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
              className="btn-secondary w-full flex-1 bg-surface hover:bg-surface-alt"
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
                <><CheckCircle2 className="w-4 h-4" /> Marcar como Asistio</>
              ) : (
                <><X className="w-4 h-4" /> Marcar No Asistio</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
