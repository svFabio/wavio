import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHorariosDisponibles } from '../../../shared/hooks/useHorariosDisponibles';
import { X, Clock, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import type { EventoCalendario } from '../types';

interface ModalReprogramarProps {
  isOpen: boolean;
  onClose: () => void;
  cita: EventoCalendario;
  onSubmit: (
    citaId: string,
    fecha: string,
    horario: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ModalReprogramar = ({ isOpen, onClose, cita, onSubmit }: ModalReprogramarProps) => {
  const [fecha, setFecha] = useState(format(cita.start, 'yyyy-MM-dd'));
  const [horario, setHorario] = useState(format(cita.start, 'HH:mm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { data: horariosDisponibles = [], isLoading: loadingHorarios } = useHorariosDisponibles(
    fecha,
    isOpen,
  );

  // Focus trap and return focus
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          const focusable = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length > 0) focusable[0].focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (
      isOpen &&
      !horariosDisponibles.includes(horario) &&
      fecha !== format(cita.start, 'yyyy-MM-dd')
    ) {
      setHorario('');
    }
  }, [isOpen, horariosDisponibles, horario, fecha, cita.start]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await onSubmit(cita.id, fecha, horario);
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al reprogramar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Reprogramar cita"
        onKeyDown={handleKeyDown}
        className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Reprogramar Cita
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors"
          >
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
            <button type="submit" disabled={loading || !horario} className="btn-primary flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
