import type { View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, LayoutGrid, Clock, Plus } from 'lucide-react';

interface CustomToolbarProps {
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
  view: View;
  label: string;
  onNuevaCita: () => void;
}

export const CustomToolbar = ({ onNavigate, onView, view, label, onNuevaCita }: CustomToolbarProps) => {
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
            className={`absolute top-1 bottom-1 rounded-lg bg-surface shadow-sm transition-all duration-300 ease-out border border-border/50 ${view === 'month' ? 'left-1 w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'
              }`}
          />
          <button
            onClick={() => onView('month')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === 'month' ? 'text-primary' : 'text-txt-muted hover:text-txt'
              }`}
          >
            <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Mes</span>
          </button>
          <button
            onClick={() => onView('day')}
            className={`relative z-10 flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${view === 'day' ? 'text-primary' : 'text-txt-muted hover:text-txt'
              }`}
          >
            <Clock className="w-4 h-4" /> <span className="hidden sm:inline">Día</span>
          </button>
        </div>
      </div>
    </div>
  );
};
