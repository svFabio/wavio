import { Plus, Trash2 } from 'lucide-react';

type RangoHorario = { activo: boolean; horaInicio: string; horaFin: string };

interface DayRowProps {
  dia: { value: number; label: string };
  rangos: RangoHorario[];
  diaActivo: boolean;
  handleToggle: (diaValue: number) => void;
  handleChange: (
    diaValue: number,
    index: number,
    field: 'horaInicio' | 'horaFin',
    value: string,
  ) => void;
  handleRemoveRange: (diaValue: number, index: number) => void;
  handleAddRange: (diaValue: number) => void;
}

export const DayRow = ({
  dia,
  rangos,
  diaActivo,
  handleToggle,
  handleChange,
  handleRemoveRange,
  handleAddRange,
}: DayRowProps) => {
  return (
    <div
      className={`flex items-start gap-6 p-4 rounded-xl border transition-colors ${
        diaActivo ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-elevated/30'
      }`}
    >
      {/* Toggle & Label */}
      <div className="flex items-center gap-4 w-40 mt-1.5">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={diaActivo}
              onChange={() => handleToggle(dia.value)}
            />
            <div
              className={`block w-10 h-6 rounded-full transition-colors border ${
                diaActivo ? 'bg-primary border-primary' : 'bg-surface-elevated border-border-strong'
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${
                diaActivo
                  ? 'bg-surface transform translate-x-4'
                  : 'bg-surface-elevated border border-border-strong'
              }`}
            ></div>
          </div>
        </label>
        <span className={`text-sm font-medium ${diaActivo ? 'text-txt' : 'text-txt-muted'}`}>
          {dia.label}
        </span>
      </div>

      {/* Ranges Container */}
      <div className="flex-1 space-y-3">
        {rangos.map((config, index) => (
          <div key={`${dia.value}-${config.horaInicio}-${config.horaFin}-${index}`} className="flex items-center gap-3">
            <input
              type="time"
              disabled={!diaActivo}
              value={config.horaInicio}
              onChange={(e) => handleChange(dia.value, index, 'horaInicio', e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:text-txt-muted font-mono"
            />
            <span className="text-txt-muted text-sm font-medium">hasta</span>
            <input
              type="time"
              disabled={!diaActivo}
              value={config.horaFin}
              onChange={(e) => handleChange(dia.value, index, 'horaFin', e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:text-txt-muted font-mono"
            />

            {rangos.length > 1 && (
              <button
                onClick={() => handleRemoveRange(dia.value, index)}
                disabled={!diaActivo}
                className="p-1.5 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-txt-muted"
                title="Eliminar rango"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => handleAddRange(dia.value)}
          disabled={!diaActivo}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:hover:text-primary px-1 py-1"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar rango
        </button>
      </div>
    </div>
  );
};
