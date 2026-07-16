import { useState, useEffect } from 'react';
import { DIAS_SEMANA } from '../types';
import type { HorarioNegocio } from '../types';
import { Loader2 } from 'lucide-react';
import { DayRow } from './DayRow';

interface HorariosTabProps {
  horarios: HorarioNegocio[];
  onSave: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => void;
  isLoading: boolean;
  isSaving?: boolean;
}

type RangoHorario = { activo: boolean; horaInicio: string; horaFin: string };

export const HorariosTab = ({ horarios, onSave, isLoading, isSaving }: HorariosTabProps) => {
  // Estado local para editar
  const [localHorarios, setLocalHorarios] = useState<Record<number, Array<RangoHorario>>>({});

  // Inicializar estado desde props
  useEffect(() => {
    const map: Record<number, Array<RangoHorario>> = {};

    // Iniciar con array vacio o con valores por defecto
    DIAS_SEMANA.forEach((dia) => {
      map[dia.value] = [];
    });

    // Sobrescribir con horarios existentes
    if (horarios && horarios.length > 0) {
      horarios.forEach((h) => {
        if (!map[h.diaSemana]) {
          map[h.diaSemana] = [];
        }
        map[h.diaSemana].push({
          activo: h.activo,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        });
      });
    }

    // Asegurar que al menos exista 1 rango (aunque sea inactivo) por día
    DIAS_SEMANA.forEach((dia) => {
      if (map[dia.value].length === 0) {
        map[dia.value].push({ activo: false, horaInicio: '09:00', horaFin: '13:00' });
      }
    });

    setLocalHorarios(map);
  }, [horarios]);

  const handleToggle = (dia: number) => {
    setLocalHorarios((prev) => {
      const isAnyActive = prev[dia].some((r) => r.activo);
      // Toggle all to the opposite of current state
      return {
        ...prev,
        [dia]: prev[dia].map((r) => ({ ...r, activo: !isAnyActive })),
      };
    });
  };

  const handleChange = (
    dia: number,
    index: number,
    field: 'horaInicio' | 'horaFin',
    value: string,
  ) => {
    setLocalHorarios((prev) => {
      const newDia = [...prev[dia]];
      newDia[index] = { ...newDia[index], [field]: value };
      return { ...prev, [dia]: newDia };
    });
  };

  const handleAddRange = (dia: number) => {
    setLocalHorarios((prev) => {
      const newDia = [...prev[dia]];
      // If adding a range, ensure it's active if the day is active
      const isActive = newDia.length > 0 ? newDia[0].activo : true;
      newDia.push({ activo: isActive, horaInicio: '14:00', horaFin: '18:00' });
      return { ...prev, [dia]: newDia };
    });
  };

  const handleRemoveRange = (dia: number, index: number) => {
    setLocalHorarios((prev) => {
      if (prev[dia].length <= 1) return prev; // Mínimo 1 rango por día
      const newDia = [...prev[dia]];
      newDia.splice(index, 1);
      return { ...prev, [dia]: newDia };
    });
  };

  const handleSave = () => {
    // Formatear para el endpoint (solo enviamos los activos)
    const payload: Array<{ diaSemana: number; horaInicio: string; horaFin: string }> = [];

    Object.entries(localHorarios).forEach(([diaStr, rangos]) => {
      rangos.forEach((rango) => {
        if (rango.activo) {
          payload.push({
            diaSemana: Number(diaStr),
            horaInicio: rango.horaInicio,
            horaFin: rango.horaFin,
          });
        }
      });
    });

    onSave(payload);
  };

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
          onClick={handleSave}
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
