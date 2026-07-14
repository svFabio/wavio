import { Loader2 } from 'lucide-react';

interface HorariosGridProps {
  horarios: string[];
  selected: string;
  onSelect: (horario: string) => void;
  loading: boolean;
}

export const HorariosGrid = ({ horarios, selected, onSelect, loading }: HorariosGridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-txt-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando horarios...
      </div>
    );
  }

  if (horarios.length === 0) {
    return (
      <div className="p-3 bg-warning-light border border-warning/20 rounded-xl text-warning-dark text-sm">
        No hay horarios disponibles hoy
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {horarios.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onSelect(h)}
          className={`py-2 px-1 rounded-lg font-semibold text-xs transition-all ${
            selected === h
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 transform scale-105'
              : 'bg-surface-elevated text-txt-secondary hover:bg-border-light'
          }`}
        >
          {h}
        </button>
      ))}
    </div>
  );
};
