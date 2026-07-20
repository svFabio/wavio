import { Clock, DollarSign, Trash2 } from 'lucide-react';
import type { Servicio } from '../types';

interface ServiceCardProps {
  svc: Servicio;
  formatDuration: (minutos: number) => string;
  onUpdate: (id: number, data: Partial<Servicio>) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export const ServiceCard = ({
  svc,
  formatDuration,
  onUpdate,
  onDelete,
  isLoading,
}: ServiceCardProps) => {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        svc.activo
          ? 'bg-surface border-border hover:border-primary/50'
          : 'bg-surface-elevated/50 border-border-light opacity-60'
      }`}
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div>
          <div className="font-medium text-sm text-txt">{svc.nombre}</div>
          {svc.categoria && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase font-bold rounded-full">
              {svc.categoria}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-txt-muted">
          <Clock className="w-4 h-4" />
          {formatDuration(svc.duracionMinutos)}
        </div>
        <div className="text-sm text-txt-muted">Buffer: {svc.bufferMinutos} min</div>
        <div className="flex items-center gap-1 font-medium text-success text-sm">
          <DollarSign className="w-4 h-4" />
          {svc.precio}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={svc.activo}
              onChange={(e) => onUpdate(svc.id, { activo: e.target.checked })}
              disabled={isLoading}
            />
            <div
              className={`block w-10 h-6 rounded-full transition-colors ${
                svc.activo ? 'bg-primary' : 'bg-border-strong'
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 bg-surface w-4 h-4 rounded-full transition-transform ${
                svc.activo ? 'transform translate-x-4' : ''
              }`}
            ></div>
          </div>
        </label>
        <button
          onClick={() => onDelete(svc.id)}
          disabled={isLoading}
          className="p-2 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
