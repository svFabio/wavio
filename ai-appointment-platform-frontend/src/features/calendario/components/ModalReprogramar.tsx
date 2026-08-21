import { useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useModalAccessibility } from '../../../shared/hooks/useModalAccessibility';
import { Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import type { EventoCalendario } from '../types';
import { ModalShell } from '../../../shared/components/ModalShell';

interface ModalReprogramarProps {
  isOpen: boolean;
  onClose: () => void;
  cita: EventoCalendario;
  fecha: string;
  onFechaChange: (fecha: string) => void;
  horario: string;
  onHorarioChange: (horario: string) => void;
  horariosDisponibles: string[];
  loadingHorarios: boolean;
  saving: boolean;
  error: string | null;
  onSubmit: () => void;
}

export const ModalReprogramar = ({
  isOpen,
  onClose,
  cita,
  fecha,
  onFechaChange,
  horario,
  onHorarioChange,
  horariosDisponibles,
  loadingHorarios,
  saving,
  error,
  onSubmit,
}: ModalReprogramarProps): React.JSX.Element | null => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
  });

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Reprogramar Cita" size="md">
      <form
        onSubmit={(e): void => {
          e.preventDefault();
          onSubmit();
        }}
        className="p-6 space-y-5"
      >
        {error && (
          <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-surface-elevated rounded-xl text-sm border border-border">
          <p className="font-bold text-txt-muted text-xs uppercase mb-1 tracking-wider">
            Cita Actual
          </p>
          <p className="font-bold text-txt">{cita.title}</p>
          <p className="text-txt-secondary">
            {format(cita.start, 'EEEE d MMMM, HH:mm', { locale: es })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-txt mb-1.5">Nueva Fecha</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => onFechaChange(e.target.value)}
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
                  onClick={() => onHorarioChange(h)}
                  className={`py-2 px-1 rounded-lg font-semibold text-xs transition-all ${
                    horario === h
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 transform scale-105'
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
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !horario} className="btn-primary flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cambio'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
