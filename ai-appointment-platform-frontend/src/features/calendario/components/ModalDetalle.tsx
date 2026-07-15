import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Info } from 'lucide-react';
import type { EventoCalendario } from '../types';
import { DetalleInfo } from './DetalleInfo';
import { DetalleAcciones } from './DetalleAcciones';

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
  onGuardarDescripcion,
}: ModalDetalleProps) => {
  const [descripcion, setDescripcion] = useState(event?.resource?.descripcion || '');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (event) {
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
  }, [event]);

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

  if (!event) return null;

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
      setError(err instanceof Error ? err.message : 'Error de conexion al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalles de la cita"
        onKeyDown={handleKeyDown}
        className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Detalles de la Cita
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-txt-muted" />
          </button>
        </div>

        <DetalleInfo
          event={event}
          descripcion={descripcion}
          onDescripcionChange={(v) => {
            setDescripcion(v);
            setGuardado(false);
          }}
          guardando={guardando}
          guardado={guardado}
          error={error}
          onGuardar={guardarDescripcion}
        />

        <DetalleAcciones
          event={event}
          onReprogramar={onReprogramar}
          onNoAsistio={onNoAsistio}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
