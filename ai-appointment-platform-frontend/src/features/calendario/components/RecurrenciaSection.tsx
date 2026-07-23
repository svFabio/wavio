import { format } from 'date-fns';
import { Repeat } from 'lucide-react';

interface RecurrenciaSectionProps {
  esRecurrente: boolean;
  recurrence: 'weekly' | 'biweekly' | 'monthly' | undefined;
  recurrenceEnd: string | undefined;
  fechaBase: string;
  onToggle: (checked: boolean) => void;
  onFrequencyChange: (value: 'weekly' | 'biweekly' | 'monthly') => void;
  onEndDateChange: (value: string) => void;
}

export const RecurrenciaSection = ({
  esRecurrente,
  recurrence,
  recurrenceEnd,
  fechaBase,
  onToggle,
  onFrequencyChange,
  onEndDateChange,
}: RecurrenciaSectionProps): JSX.Element => (
  <div className="border-t border-border pt-4">
    <label className="flex items-center gap-2 cursor-pointer w-max">
      <input
        type="checkbox"
        checked={esRecurrente}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
      />
      <span className="text-sm font-semibold text-txt">Repetir cita</span>
      <Repeat className="w-4 h-4 text-txt-muted" />
    </label>

    {esRecurrente && (
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <select
            value={recurrence || 'weekly'}
            onChange={(e) => onFrequencyChange(e.target.value as 'weekly' | 'biweekly' | 'monthly')}
            className="input-modern appearance-none bg-surface"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
        <div>
          <input
            type="date"
            required={esRecurrente}
            value={recurrenceEnd || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={fechaBase}
            className="input-modern"
          />
        </div>
      </div>
    )}
  </div>
);

export const calcularFechaFinPorDefecto = (fechaBase: string): string =>
  format(new Date(new Date(fechaBase).setMonth(new Date(fechaBase).getMonth() + 1)), 'yyyy-MM-dd');
