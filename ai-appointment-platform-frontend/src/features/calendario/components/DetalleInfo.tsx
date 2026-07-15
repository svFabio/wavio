import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  User,
  Phone,
  Sparkles,
  Timer,
  MapPin,
  Globe,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { EventoCalendario } from '../types';

interface DetalleInfoProps {
  event: EventoCalendario;
  descripcion: string;
  onDescripcionChange: (value: string) => void;
  guardando: boolean;
  guardado: boolean;
  error: string | null;
  onGuardar: () => void;
}

const getStatusBadge = (estado?: string) => {
  switch (estado) {
    case 'CONFIRMADA':
      return 'badge-success';
    case 'VALIDAR':
      return 'badge-warning';
    case 'PENDIENTE_PAGO':
      return 'badge-info';
    case 'NO_ASISTIO':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

const formatStatus = (estado?: string) => {
  switch (estado) {
    case 'CONFIRMADA':
      return 'Confirmada';
    case 'VALIDAR':
      return 'Validar Pago';
    case 'PENDIENTE_PAGO':
      return 'Pendiente de Pago';
    case 'NO_ASISTIO':
      return 'No Asistio';
    default:
      return estado || 'Desconocido';
  }
};

export const DetalleInfo = ({
  event,
  descripcion,
  onDescripcionChange,
  guardando,
  guardado,
  error,
  onGuardar,
}: DetalleInfoProps) => {
  const statusClass = getStatusBadge(event.resource?.estado);
  const esPresencial = event.resource?.origen === 'presencial';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className={`badge ${statusClass} gap-1.5`}>
          {event.resource?.estado === 'CONFIRMADA' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {event.resource?.estado === 'VALIDAR' && <AlertCircle className="w-3.5 h-3.5" />}
          {event.resource?.estado === 'PENDIENTE_PAGO' && <Timer className="w-3.5 h-3.5" />}
          {formatStatus(event.resource?.estado)}
        </span>
        <span className={`badge ${esPresencial ? 'badge-warning' : 'badge-info'} gap-1.5`}>
          {esPresencial ? <MapPin className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
          {esPresencial ? 'Presencial' : 'Virtual'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-0.5">
              Cliente
            </p>
            <p className="font-semibold text-txt text-base">{event.title}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-0.5">
              Telefono
            </p>
            <p className="font-medium text-txt text-sm">
              {event.resource?.telefono || 'No registrado'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-0.5">
              Servicio
            </p>
            <p className="font-medium text-txt">{event.resource?.servicio || 'Spa'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-0.5">
              Horario
            </p>
            <p className="font-medium text-txt text-sm">
              {format(event.start, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
            <p className="text-lg font-bold text-txt mt-0.5">
              {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {event.resource?.tipo === 'cita' && (
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-txt-muted" />
            <p className="text-xs text-txt-muted font-bold uppercase tracking-wider">
              Notas del Admin
            </p>
          </div>
          <div className="relative">
            <label htmlFor="modal-notas" className="sr-only">
              Notas del admin
            </label>
            <textarea
              id="modal-notas"
              value={descripcion}
              onChange={(e) => onDescripcionChange(e.target.value)}
              className="input-modern w-full text-sm resize-none min-h-[80px]"
              placeholder="Agregar notas privadas..."
              rows={3}
            />
            <button
              onClick={onGuardar}
              disabled={guardando}
              aria-label="Guardar notas"
              className="absolute bottom-2 right-2 text-xs px-2 py-1.5 bg-surface-elevated text-txt-secondary rounded-lg hover:bg-surface-alt transition-all flex items-center gap-1.5 disabled:opacity-50 border border-border"
            >
              {guardando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : guardado ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Guardado
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Guardar
                </>
              )}
            </button>
          </div>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
};
