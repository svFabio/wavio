import { DIAS, DIAS_LABEL } from '../types';

interface HorariosTabProps {
  horariosTexto: Record<string, string>;
  onHorariosChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const HorariosTab = ({ horariosTexto, onHorariosChange }: HorariosTabProps) => (
  <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-4">
    <p className="text-sm text-txt-muted">
      Escribe los horarios disponibles por dia separados por coma. Formato:{' '}
      <span className="font-mono text-txt-secondary">09:00, 11:30, 15:00</span>
    </p>
    {DIAS.map((dia) => (
      <div key={dia} className="flex items-center gap-4">
        <span className="w-24 shrink-0 text-sm font-semibold text-txt-secondary">
          {DIAS_LABEL[dia]}
        </span>
        <input
          value={horariosTexto[dia] ?? ''}
          onChange={(e) => onHorariosChange((t) => ({ ...t, [dia]: e.target.value }))}
          placeholder="09:00, 11:00, 14:30..."
          aria-label={`Horarios ${DIAS_LABEL[dia]}`}
          className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-txt placeholder-txt-muted focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
        />
      </div>
    ))}
    <p className="text-xs text-txt-muted pt-1">
      Los dias sin horarios no estaran disponibles para reservas.
    </p>
  </div>
);
