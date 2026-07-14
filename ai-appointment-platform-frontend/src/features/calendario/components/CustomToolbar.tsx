import type { View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, LayoutGrid, Clock, Plus } from 'lucide-react';

export interface CustomToolbarProps {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  view: View;
  label: string;
  onNuevaCita: () => void;
}

export const CustomToolbar = ({
  onNavigate,
  onView,
  view,
  label,
  onNuevaCita,
}: CustomToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-5 gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60">
          <button
            onClick={() => onNavigate('PREV')}
            aria-label="Anterior"
            className="p-2 hover:bg-surface rounded-md text-txt-muted hover:text-txt transition-all duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1.5 text-xs font-semibold text-txt-muted hover:text-primary hover:bg-primary-light/50 rounded-md transition-all duration-150 uppercase tracking-wider"
          >
            Hoy
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            aria-label="Siguiente"
            className="p-2 hover:bg-surface rounded-md text-txt-muted hover:text-txt transition-all duration-150"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-lg font-bold text-txt tracking-tight">{label}</h2>
      </div>

      <div className="flex items-center gap-2.5">
        <button onClick={onNuevaCita} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Cita</span>
          <span className="sm:hidden">Nueva</span>
        </button>

        <div className="flex bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60 relative">
          <div
            className={`absolute top-0.5 bottom-0.5 rounded-md bg-surface border border-border/40 shadow-sm transition-all duration-300 ease-out ${
              view === 'month'
                ? 'left-0.5 w-[calc(50%-2px)]'
                : 'left-[calc(50%+2px)] w-[calc(50%-2px)]'
            }`}
          />
          <button
            onClick={() => onView('month')}
            aria-label="Vista de mes"
            aria-pressed={view === 'month'}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ${
              view === 'month' ? 'text-primary' : 'text-txt-muted hover:text-txt'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mes</span>
          </button>
          <button
            onClick={() => onView('day')}
            aria-label="Vista de dia"
            aria-pressed={view === 'day'}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ${
              view === 'day' ? 'text-primary' : 'text-txt-muted hover:text-txt'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dia</span>
          </button>
        </div>
      </div>
    </div>
  );
};
