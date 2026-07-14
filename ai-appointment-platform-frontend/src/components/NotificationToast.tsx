import { useEffect, useState } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';

interface NotificationToastProps {
  id: string;
  clienteNombre: string;
  fecha: string;
  horario: string;
  onDismiss: (id: string) => void;
}

export const NotificationToast = ({
  id,
  clienteNombre,
  fecha,
  horario,
  onDismiss,
}: NotificationToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    const t = setTimeout(() => onDismiss(id), 300);
    return () => clearTimeout(t);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;

    if (isUpSwipe) {
      handleClose();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`
        bg-surface rounded-xl shadow-2xl border-l-4 border-primary p-4
        transition-all duration-300 transform cursor-pointer hover:scale-105
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-x-full opacity-0'}
        w-full mb-3 pointer-events-auto
      `}
      onClick={handleClose}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-bold text-txt text-sm">Nueva Cita</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Cerrar notificacion"
              className="text-txt-muted hover:text-txt transition-colors p-1 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-txt">
              <User className="w-3 h-3" />
              <span className="font-medium truncate">{clienteNombre}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-txt-secondary">
              <Clock className="w-3 h-3" />
              <span>
                {fecha} a las {horario}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-txt-muted text-center md:hidden">
        Desliza hacia arriba para cerrar
      </div>
    </div>
  );
};
