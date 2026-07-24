import React from 'react';
import { Loader2 } from 'lucide-react';
import { DIAS_SEMANA } from '../types';
import type { HorarioNegocio } from '../types';
import { DayRow } from './DayRow';
import { useHorariosTabState } from '../hooks/useHorariosTabState';

interface HorariosTabProps {
  horarios: HorarioNegocio[];
  onSave: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => void;
  isLoading: boolean;
  isSaving?: boolean;
}

export const HorariosTab = ({
  horarios,
  onSave,
  isLoading,
  isSaving,
}: HorariosTabProps): React.JSX.Element => {
  const {
    localHorarios,
    handleToggle,
    handleChange,
    handleAddRange,
    handleRemoveRange,
    buildPayload,
  } = useHorariosTabState(horarios);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-txt-muted" />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-sm text-txt-muted max-w-md">
          Define el horario regular de atención de tu negocio. Puedes agregar múltiples rangos de
          horas por día.
        </p>
        <button
          onClick={() => onSave(buildPayload())}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar Horarios
        </button>
      </div>

      <div className="space-y-4">
        {DIAS_SEMANA.map((dia) => {
          const rangos = localHorarios[dia.value] || [];
          const diaActivo = rangos.length > 0 && rangos.some((r) => r.activo);

          return (
            <DayRow
              key={dia.value}
              dia={dia}
              rangos={rangos}
              diaActivo={diaActivo}
              handleToggle={handleToggle}
              handleChange={handleChange}
              handleRemoveRange={handleRemoveRange}
              handleAddRange={handleAddRange}
            />
          );
        })}
      </div>
    </div>
  );
};
