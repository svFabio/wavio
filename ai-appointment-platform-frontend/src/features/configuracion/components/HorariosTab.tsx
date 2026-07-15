import { useState, useEffect } from 'react';
import { DIAS_SEMANA } from '../types';
import type { HorarioNegocio } from '../types';
import { Loader2, Plus, Trash2 } from 'lucide-react';

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
            <div
              key={dia.value}
              className={`flex items-start gap-6 p-4 rounded-xl border transition-colors ${
                diaActivo
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-surface-elevated/30'
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
                      className={`block w-10 h-6 rounded-full transition-colors ${
                        diaActivo ? 'bg-primary' : 'bg-border-strong'
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-surface w-4 h-4 rounded-full transition-transform ${
                        diaActivo ? 'transform translate-x-4' : ''
                      }`}
                    ></div>
                  </div>
                </label>
                <span
                  className={`text-sm font-medium ${diaActivo ? 'text-txt' : 'text-txt-muted'}`}
                >
                  {dia.label}
                </span>
              </div>

              {/* Ranges Container */}
              <div className="flex-1 space-y-3">
                {rangos.map((config, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="time"
                      disabled={!diaActivo}
                      value={config.horaInicio}
                      onChange={(e) => handleChange(dia.value, index, 'horaInicio', e.target.value)}
                      className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-elevated font-mono"
                    />
                    <span className="text-txt-muted text-sm font-medium">hasta</span>
                    <input
                      type="time"
                      disabled={!diaActivo}
                      value={config.horaFin}
                      onChange={(e) => handleChange(dia.value, index, 'horaFin', e.target.value)}
                      className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-elevated font-mono"
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
        })}
      </div>
    </div>
  );
};
