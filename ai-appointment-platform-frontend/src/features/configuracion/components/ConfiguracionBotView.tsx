import type { Tab, Servicio, HorarioNegocio } from '../types';
import { HeaderCard } from './HeaderCard';
import { GeneralTab } from './GeneralTab';
import { ServiciosTab } from './ServiciosTab';
import { HorariosTab } from './HorariosTab';

interface ConfiguracionBotViewProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  loading: boolean;
  error: string | null;
  trigger: string;
  onTriggerChange: (value: string) => void;
  mensajeBienvenida: string;
  onMensajeBienvenidaChange: (value: string) => void;
  mensajeConfirmacion: string;
  onMensajeConfirmacionChange: (value: string) => void;
  cobrarAdelanto: boolean;
  onCobrarAdelantoChange: (value: boolean) => void;
  porcentajeAdelanto: number;
  onPorcentajeAdelantoChange: (value: number) => void;
  onSaveGeneral: () => void;
  isGeneralPending: boolean;
  isGeneralSuccess: boolean;
  
  servicios: Servicio[];
  onAddServicio: (data: { nombre: string; duracionMinutos: number; bufferMinutos: number; precio: number }) => void;
  onUpdateServicio: (id: number, data: Partial<Servicio>) => void;
  onDeleteServicio: (id: number) => void;
  
  horarios: HorarioNegocio[];
  onSaveHorarios: (horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>) => void;
  isHorariosSaving: boolean;

  isPendingAny: boolean;
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-2">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-3 w-64 rounded" />
          </div>
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="flex bg-surface-elevated p-1 rounded-xl w-fit gap-1">
      <div className="skeleton h-9 w-24 rounded-lg" />
      <div className="skeleton h-9 w-24 rounded-lg" />
      <div className="skeleton h-9 w-24 rounded-lg" />
    </div>
    <div className="bg-surface rounded-2xl border border-border-light p-6 space-y-4">
      <div className="space-y-2">
        <div className="skeleton h-3 w-56 rounded" />
        <div className="skeleton h-10 rounded-xl" />
        <div className="skeleton h-3 w-72 rounded" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-40 rounded" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-3 w-64 rounded" />
      </div>
    </div>
  </div>
);

const TAB_LABELS: Record<Tab, string> = {
  general: 'General',
  servicios: 'Servicios',
  horarios: 'Horarios',
};

export const ConfiguracionBotView = ({
  tab,
  onTabChange,
  loading,
  error,
  trigger,
  onTriggerChange,
  mensajeBienvenida,
  onMensajeBienvenidaChange,
  mensajeConfirmacion,
  onMensajeConfirmacionChange,
  cobrarAdelanto,
  onCobrarAdelantoChange,
  porcentajeAdelanto,
  onPorcentajeAdelantoChange,
  onSaveGeneral,
  isGeneralPending,
  isGeneralSuccess,
  servicios,
  onAddServicio,
  onUpdateServicio,
  onDeleteServicio,
  horarios,
  onSaveHorarios,
  isHorariosSaving,
  isPendingAny,
}: ConfiguracionBotViewProps) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {tab === 'general' && (
        <HeaderCard isPending={isGeneralPending} isSuccess={isGeneralSuccess} onSave={onSaveGeneral} />
      )}
      
      {/* For other tabs, we no longer need the HeaderCard since they save individually or we can hide it */}
      {tab !== 'general' && (
        <div className="card-modern overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border bg-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-txt">
                {TAB_LABELS[tab]}
              </h1>
              <p className="text-txt-muted text-sm mt-1">Configuración de {TAB_LABELS[tab].toLowerCase()} del bot</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex bg-surface-elevated p-1 rounded-xl w-fit">
        {(['general', 'servicios', 'horarios'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              tab === t ? 'bg-surface text-txt shadow-sm border border-border' : 'text-txt-muted hover:text-txt'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <GeneralTab
          trigger={trigger}
          onTriggerChange={onTriggerChange}
          mensajeBienvenida={mensajeBienvenida}
          onMensajeBienvenidaChange={onMensajeBienvenidaChange}
          mensajeConfirmacion={mensajeConfirmacion}
          onMensajeConfirmacionChange={onMensajeConfirmacionChange}
          cobrarAdelanto={cobrarAdelanto}
          onCobrarAdelantoChange={onCobrarAdelantoChange}
          porcentajeAdelanto={porcentajeAdelanto}
          onPorcentajeAdelantoChange={onPorcentajeAdelantoChange}
        />
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
    </div>
  );
};
