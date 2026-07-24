import { useState, useEffect } from 'react';
import { DIAS_SEMANA } from '../types';
import type { HorarioNegocio } from '../types';

export type RangoHorario = { activo: boolean; horaInicio: string; horaFin: string };

export type HorariosPayloadItem = { diaSemana: number; horaInicio: string; horaFin: string };

interface UseHorariosTabStateResult {
  localHorarios: Record<number, RangoHorario[]>;
  handleToggle: (dia: number) => void;
  handleChange: (
    dia: number,
    index: number,
    field: 'horaInicio' | 'horaFin',
    value: string,
  ) => void;
  handleAddRange: (dia: number) => void;
  handleRemoveRange: (dia: number, index: number) => void;
  buildPayload: () => HorariosPayloadItem[];
}

export const useHorariosTabState = (horarios: HorarioNegocio[]): UseHorariosTabStateResult => {
  const [localHorarios, setLocalHorarios] = useState<Record<number, RangoHorario[]>>({});

  useEffect(() => {
    const map: Record<number, RangoHorario[]> = {};

    DIAS_SEMANA.forEach((dia) => {
      map[dia.value] = [];
    });

    if (horarios && horarios.length > 0) {
      horarios.forEach((h) => {
        if (!map[h.diaSemana]) map[h.diaSemana] = [];
        map[h.diaSemana].push({ activo: h.activo, horaInicio: h.horaInicio, horaFin: h.horaFin });
      });
    }

    DIAS_SEMANA.forEach((dia) => {
      if (map[dia.value].length === 0) {
        map[dia.value].push({ activo: false, horaInicio: '09:00', horaFin: '13:00' });
      }
    });

    setLocalHorarios(map);
  }, [horarios]);

  const handleToggle = (dia: number): void => {
    setLocalHorarios((prev) => {
      const isAnyActive = prev[dia].some((r) => r.activo);
      return { ...prev, [dia]: prev[dia].map((r) => ({ ...r, activo: !isAnyActive })) };
    });
  };

  const handleChange = (
    dia: number,
    index: number,
    field: 'horaInicio' | 'horaFin',
    value: string,
  ): void => {
    setLocalHorarios((prev) => {
      const newDia = [...prev[dia]];
      newDia[index] = { ...newDia[index], [field]: value };
      return { ...prev, [dia]: newDia };
    });
  };

  const handleAddRange = (dia: number): void => {
    setLocalHorarios((prev) => {
      const newDia = [...prev[dia]];
      const isActive = newDia.length > 0 ? newDia[0].activo : true;
      newDia.push({ activo: isActive, horaInicio: '14:00', horaFin: '18:00' });
      return { ...prev, [dia]: newDia };
    });
  };

  const handleRemoveRange = (dia: number, index: number): void => {
    setLocalHorarios((prev) => {
      if (prev[dia].length <= 1) return prev;
      const newDia = [...prev[dia]];
      newDia.splice(index, 1);
      return { ...prev, [dia]: newDia };
    });
  };

  const buildPayload = (): HorariosPayloadItem[] => {
    const payload: HorariosPayloadItem[] = [];
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
    return payload;
  };

  return {
    localHorarios,
    handleToggle,
    handleChange,
    handleAddRange,
    handleRemoveRange,
    buildPayload,
  };
};
