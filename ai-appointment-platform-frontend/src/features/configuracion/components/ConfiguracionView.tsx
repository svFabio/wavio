import type { Servicio, HorarioNegocio, HorarioEspecial } from '../types';
import { ServiciosTab } from './ServiciosTab';
import { HorariosTab } from './HorariosTab';
import { HorariosEspecialesTab } from './HorariosEspecialesTab';
import { useState } from 'react';
import { LoadingSkeleton } from '../../../shared/components/skeletons/LoadingSkeleton';

type ConfigTab = 'servicios' | 'horarios' | 'horariosEspeciales';

export interface ServiciosHandlers {
  servicios: Servicio[];
  onAdd: (data: {
    nombre: string;
    duracionMinutos: number;
    bufferMinutos: number;
    precio: number;
  }) => void;
  onUpdate: (id: number, data: Partial<Servicio>) => void;
  onDelete: (id: number) => void;
}

export interface HorariosHandlers {
  horarios: HorarioNegocio[];
  onSave: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => void;
  isSaving: boolean;
}

export interface HorariosEspecialesHandlers {
  horariosEspeciales: HorarioEspecial[];
  onCreate: (data: {
    fecha: string;
    cerrado: boolean;
    horaInicio: string | null;
    horaFin: string | null;
  }) => void;
  onDelete: (id: number) => void;
}

interface ConfiguracionViewProps {
  ui: {
    loading: boolean;
    error: string | null;
    isPendingAny: boolean;
  };
  serviciosHandlers: ServiciosHandlers;
  horariosHandlers: HorariosHandlers;
  horariosEspecialesHandlers: HorariosEspecialesHandlers;
}

const TAB_LABELS: Record<ConfigTab, string> = {
  servicios: 'Servicios',
  horarios: 'Horarios Regulares',
  horariosEspeciales: 'Fechas Especiales',
};

export const ConfiguracionView = ({
  ui,
  serviciosHandlers,
  horariosHandlers,
  horariosEspecialesHandlers,
}: ConfiguracionViewProps) => {
  const [tab, setTab] = useState<ConfigTab>('servicios');

  if (ui.loading) {
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

      {ui.error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {ui.error}
        </div>
      )}

      {tab === 'servicios' && (
        <ServiciosTab
          servicios={serviciosHandlers.servicios}
          onAdd={serviciosHandlers.onAdd}
          onUpdate={serviciosHandlers.onUpdate}
          onDelete={serviciosHandlers.onDelete}
          isLoading={ui.isPendingAny}
        />
      )}

      {tab === 'horarios' && (
        <HorariosTab
          horarios={horariosHandlers.horarios}
          onSave={horariosHandlers.onSave}
          isLoading={ui.loading}
          isSaving={horariosHandlers.isSaving}
        />
      )}

      {tab === 'horariosEspeciales' && (
        <HorariosEspecialesTab
          horariosEspeciales={horariosEspecialesHandlers.horariosEspeciales}
          onCreate={horariosEspecialesHandlers.onCreate}
          onDelete={horariosEspecialesHandlers.onDelete}
          isLoading={ui.loading}
        />
      )}
    </div>
  );
};
