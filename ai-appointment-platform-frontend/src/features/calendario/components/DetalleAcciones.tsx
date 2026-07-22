import { X, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import type { EventoCalendario } from '../types';

interface DetalleAccionesProps {
  event: EventoCalendario;
  onReprogramar: () => void;
  onNoAsistio: () => void;
  onClose: () => void;
  isLoadingNoShow?: boolean;
}

export const DetalleAcciones = ({
  event,
  onReprogramar,
  onNoAsistio,
  onClose,
  isLoadingNoShow = false,
}: DetalleAccionesProps) => {
  const esPasada = event.start < new Date();
  const esNoAsistio = event.resource?.estado === 'NO_ASISTIO';

  return (
    <div className="p-4 border-t border-border bg-surface-elevated/30 flex flex-col gap-3">
      <div className="flex gap-3">
        {event.resource?.tipo === 'cita' && (
          <button onClick={onReprogramar} className="btn-secondary flex-1">
            <Clock className="w-4 h-4" /> Reprogramar
          </button>
        )}
        <button onClick={onClose} className="btn-secondary flex-1">
          Cerrar
        </button>
      </div>

      {event.resource?.tipo === 'cita' && esPasada && (
        <button
          onClick={onNoAsistio}
          disabled={isLoadingNoShow}
          className={`w-full py-2.5 border rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            esNoAsistio
              ? 'border-success text-success bg-success-light/20 hover:bg-success-light/40'
              : 'border-danger/30 text-danger bg-danger-light/20 hover:bg-danger-light/40'
          } ${isLoadingNoShow ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isLoadingNoShow ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : esNoAsistio ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Marcar como Asistio
            </>
          ) : (
            <>
              <X className="w-4 h-4" /> Marcar No Asistio
            </>
          )}
        </button>
      )}
    </div>
  );
};
