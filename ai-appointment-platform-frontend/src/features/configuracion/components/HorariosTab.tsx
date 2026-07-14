import { useState, useEffect } from 'react';
import { DIAS_SEMANA } from '../types';
import type { HorarioNegocio } from '../types';
import { Loader2 } from 'lucide-react';

interface HorariosTabProps {
  horarios: HorarioNegocio[];
  onSave: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => void;
  isLoading: boolean;
  isSaving?: boolean;
}

export const HorariosTab = ({ horarios, onSave, isLoading, isSaving }: HorariosTabProps) => {
  // Estado local para editar
  const [localHorarios, setLocalHorarios] = useState<Record<number, { activo: boolean; horaInicio: string; horaFin: string }>>({});

  // Inicializar estado desde props
  useEffect(() => {
    const map: Record<number, { activo: boolean; horaInicio: string; horaFin: string }> = {};
    
    // Iniciar con valores por defecto (inactivos)
    DIAS_SEMANA.forEach(dia => {
      map[dia.value] = { activo: false, horaInicio: '09:00', horaFin: '18:00' };
    });

    // Sobrescribir con horarios existentes
    horarios.forEach(h => {
      map[h.diaSemana] = { 
        activo: h.activo, 
        horaInicio: h.horaInicio, 
        horaFin: h.horaFin 
      };
    });

    setLocalHorarios(map);
  }, [horarios]);

  const handleToggle = (dia: number) => {
    setLocalHorarios(prev => ({
      ...prev,
      [dia]: { ...prev[dia], activo: !prev[dia].activo }
    }));
  };

  const handleChange = (dia: number, field: 'horaInicio' | 'horaFin', value: string) => {
    setLocalHorarios(prev => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value }
    }));
  };

  const handleSave = () => {
    // Formatear para el endpoint (solo enviamos los activos)
    const payload = Object.entries(localHorarios)
      .filter(([_, data]) => data.activo)
      .map(([diaStr, data]) => ({
        diaSemana: Number(diaStr),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin
      }));
    
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
          Define el horario regular de atención de tu negocio. El bot solo ofrecerá disponibilidad
          dentro de estos rangos.
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
          const config = localHorarios[dia.value] || { activo: false, horaInicio: '09:00', horaFin: '18:00' };
          
          return (
            <div 
              key={dia.value} 
              className={`flex items-center gap-6 p-4 rounded-xl border transition-colors ${
                config.activo ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-elevated/30'
              }`}
            >
              {/* Toggle & Label */}
              <div className="flex items-center gap-4 w-40">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={config.activo}
                      onChange={() => handleToggle(dia.value)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${
                      config.activo ? 'bg-primary' : 'bg-border-strong'
                    }`}></div>
                    <div className={`absolute left-1 top-1 bg-surface w-4 h-4 rounded-full transition-transform ${
                      config.activo ? 'transform translate-x-4' : ''
                    }`}></div>
                  </div>
                </label>
                <span className={`text-sm font-medium ${config.activo ? 'text-txt' : 'text-txt-muted'}`}>
                  {dia.label}
                </span>
              </div>

              {/* Time Inputs */}
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="time"
                  disabled={!config.activo}
                  value={config.horaInicio}
                  onChange={(e) => handleChange(dia.value, 'horaInicio', e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-elevated font-mono"
                />
                <span className="text-txt-muted text-sm font-medium">hasta</span>
                <input
                  type="time"
                  disabled={!config.activo}
                  value={config.horaFin}
                  onChange={(e) => handleChange(dia.value, 'horaFin', e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-surface-elevated font-mono"
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-txt-muted pt-2 text-center">
        Nota: Para horarios múltiples el mismo día (ej. pausa de almuerzo), puedes agregar más rangos desde la vista avanzada (próximamente).
      </p>
    </div>
  );
};
