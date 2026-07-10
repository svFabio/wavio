import { useEffect, useState } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';

interface NotificationToastProps {
    id: string;
    clienteNombre: string;
    fecha: string;
    horario: string;
    onDismiss: (id: string) => void;
}

export const NotificationToast = ({ id, clienteNombre, fecha, horario, onDismiss }: NotificationToastProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    useEffect(() => {
        // Animación de entrada
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300); // Esperar animación
    };

    // Swipe para móvil
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
        bg-white rounded-xl shadow-2xl border-l-4 border-indigo-600 p-4 
        transition-all duration-300 transform cursor-pointer hover:scale-105
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-x-full opacity-0'}
        w-full mb-3 pointer-events-auto
      `}
            onClick={handleClose}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">Nueva Cita 🎉</h4>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mt-1 -mr-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <User className="w-3 h-3" />
                            <span className="font-medium truncate">{clienteNombre}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{fecha} a las {horario}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 text-center md:hidden">
                Desliza hacia arriba para cerrar
            </div>
        </div>
    );
};
