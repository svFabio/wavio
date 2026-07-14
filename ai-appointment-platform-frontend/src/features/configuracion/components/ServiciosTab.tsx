import { Plus, Trash2 } from 'lucide-react';
import type { Servicio } from '../types';

interface ServiciosTabProps {
  servicios: Servicio[];
  onAddServicio: () => void;
  onRemoveServicio: (key: number) => void;
  onUpdateServicio: (key: number, field: 'nombre' | 'precio', value: string | number) => void;
}

export const ServiciosTab = ({
  servicios,
  onAddServicio,
  onRemoveServicio,
  onUpdateServicio,
}: ServiciosTabProps) => (
  <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-4">
    <p className="text-sm text-txt-muted">
      El bot mostrara esta lista para que el cliente elija. El precio se muestra si es mayor a 0.
    </p>
    <div className="space-y-3">
      {servicios.map((svc) => (
        <div key={svc._key} className="flex gap-3 items-center">
          <input
            value={svc.nombre}
            onChange={(e) => onUpdateServicio(svc._key, 'nombre', e.target.value)}
            placeholder="Nombre del servicio"
            aria-label="Nombre del servicio"
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">
              $
            </span>
            <input
              type="number"
              min={0}
              value={svc.precio}
              onChange={(e) => onUpdateServicio(svc._key, 'precio', Number(e.target.value))}
              aria-label="Precio del servicio"
              className="w-full border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <button
            onClick={() => onRemoveServicio(svc._key)}
            aria-label={`Eliminar servicio ${svc.nombre || ''}`}
            className="p-2 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    <button
      onClick={onAddServicio}
      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
    >
      <Plus className="w-4 h-4" /> Agregar servicio
    </button>
  </div>
);
