import type { Servicio, HorarioNegocio, HorarioEspecial } from '../types';
import { ServiciosTab } from './ServiciosTab';
import { HorariosTab } from './HorariosTab';
import { HorariosEspecialesTab } from './HorariosEspecialesTab';
import { useState } from 'react';

type ConfigTab = 'servicios' | 'horarios' | 'horariosEspeciales';

interface ConfiguracionViewProps {
  loading: boolean;
  error: string | null;
  servicios: Servicio[];
  onAddServicio: (data: {
    nombre: string;
    duracionMinutos: number;
    bufferMinutos: number;
    precio: number;
  }) => void;
  onUpdateServicio: (id: number, data: Partial<Servicio>) => void;
  onDeleteServicio: (id: number) => void;
  horarios: HorarioNegocio[];
  onSaveHorarios: (
    horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>,
  ) => void;
  isHorariosSaving: boolean;
  horariosEspeciales: HorarioEspecial[];
  onCreateHorarioEspecial: (data: { fecha: string; cerrado: boolean; horaInicio: string | null; horaFin: string | null }) => void;
  onDeleteHorarioEspecial: (id: number) => void;
  isPendingAny: boolean;
}

const TAB_LABELS: Record<ConfigTab, string> = {
  servicios: 'Servicios',
  horarios: 'Horarios Regulares',
  horariosEspeciales: 'Fechas Especiales',
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="space-y-2">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
      </div>
      <div className="px-5 md:px-6 py-3 flex gap-2">
        <div className="skeleton h-9 w-24 rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ConfiguracionView = ({
  loading,
  error,
  servicios,
  onAddServicio,
  onUpdateServicio,
  onDeleteServicio,
  horarios,
  onSaveHorarios,
  isHorariosSaving,
  horariosEspeciales,
  onCreateHorarioEspecial,
  onDeleteHorarioEspecial,
  isPendingAny,
}: ConfiguracionViewProps) => {
  const [tab, setTab] = useState<ConfigTab>('servicios');

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-txt">Configuracion</h2>
            <p className="text-txt-muted text-sm mt-1">
              Administra servicios y horarios del negocio
            </p>
          </div>
        </div>
        <div className="px-5 md:px-6 py-3 flex gap-1 flex-wrap">
          {(['servicios', 'horarios', 'horariosEspeciales'] as ConfigTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === t
                  ? 'bg-primary/10 text-primary'
                  : 'text-txt-muted hover:text-txt hover:bg-surface-elevated'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {tab === 'servicios' && (
        <ServiciosTab
          servicios={servicios}
          onAdd={onAddServicio}
          onUpdate={onUpdateServicio}
          onDelete={onDeleteServicio}
          isLoading={isPendingAny}
        />
      )}

      {tab === 'horarios' && (
        <HorariosTab
          horarios={horarios}
          onSave={onSaveHorarios}
          isLoading={loading}
          isSaving={isHorariosSaving}
        />
      )}

      {tab === 'horariosEspeciales' && (
        <HorariosEspecialesTab
          horariosEspeciales={horariosEspeciales}
          onCreate={onCreateHorarioEspecial}
          onDelete={onDeleteHorarioEspecial}
          isLoading={loading}
        />
      )}
    </div>
  );
};
