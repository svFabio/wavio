import type { Tab, Servicio } from '../types';
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
  servicios: Servicio[];
  onAddServicio: () => void;
  onRemoveServicio: (key: number) => void;
  onUpdateServicio: (key: number, field: 'nombre' | 'precio', value: string | number) => void;
  horariosTexto: Record<string, string>;
  onHorariosChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSave: () => void;
  isPending: boolean;
  isSuccess: boolean;
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
      <div className="border border-border-light rounded-xl p-4 space-y-4">
        <div className="skeleton h-3 w-36 rounded" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="skeleton h-3 w-48 rounded" />
            <div className="skeleton h-2.5 w-64 rounded" />
          </div>
          <div className="skeleton h-6 w-11 rounded-full" />
        </div>
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
  servicios,
  onAddServicio,
  onRemoveServicio,
  onUpdateServicio,
  horariosTexto,
  onHorariosChange,
  onSave,
  isPending,
  isSuccess,
}: ConfiguracionBotViewProps) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <HeaderCard isPending={isPending} isSuccess={isSuccess} onSave={onSave} />

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
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t ? 'bg-surface text-txt shadow-sm border border-border' : 'text-txt-muted hover:text-txt'}`}
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
          onAddServicio={onAddServicio}
          onRemoveServicio={onRemoveServicio}
          onUpdateServicio={onUpdateServicio}
        />
      )}

      {tab === 'horarios' && (
        <HorariosTab horariosTexto={horariosTexto} onHorariosChange={onHorariosChange} />
      )}
    </div>
  );
};
