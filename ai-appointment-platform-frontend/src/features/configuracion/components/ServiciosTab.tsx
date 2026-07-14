import { useState } from 'react';
import { Plus, Trash2, Clock, DollarSign, Loader2 } from 'lucide-react';
import type { Servicio } from '../types';

interface ServiciosTabProps {
  servicios: Servicio[];
  onAdd: (data: {
    nombre: string;
    duracionMinutos: number;
    bufferMinutos: number;
    precio: number;
  }) => void;
  onUpdate: (id: number, data: Partial<Servicio>) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export const ServiciosTab = ({
  servicios,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: ServiciosTabProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    nombre: '',
    duracionMinutos: 60,
    bufferMinutos: 10,
    precio: 0,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.nombre.trim()) return;
    onAdd(newService);
    setNewService({ nombre: '', duracionMinutos: 60, bufferMinutos: 10, precio: 0 });
    setIsAdding(false);
  };

  const formatDuration = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-sm text-txt-muted max-w-md">
          El bot mostrará esta lista para que el cliente elija. El sistema calculará la
          disponibilidad según la duración de cada servicio.
        </p>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 bg-primary/10 rounded-lg"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4"
        >
          <h4 className="text-sm font-medium text-txt">Agregar nuevo servicio</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-txt-muted font-medium">Nombre</label>
              <input
                required
                value={newService.nombre}
                onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
                placeholder="Ej. Masaje Relajante"
                className="w-full border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-txt-muted font-medium">Duración (minutos)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={newService.duracionMinutos}
                  onChange={(e) =>
                    setNewService({ ...newService, duracionMinutos: Number(e.target.value) })
                  }
                  className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-txt-muted font-medium">Margen/Limpieza (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <input
                  type="number"
                  min={0}
                  step={5}
                  required
                  value={newService.bufferMinutos}
                  onChange={(e) =>
                    setNewService({ ...newService, bufferMinutos: Number(e.target.value) })
                  }
                  className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-txt-muted font-medium">Precio</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={newService.precio}
                  onChange={(e) => setNewService({ ...newService, precio: Number(e.target.value) })}
                  className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm text-txt-muted hover:text-txt transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
              disabled={isLoading}
            >
              Guardar Servicio
            </button>
          </div>
        </form>
      )}

      {isLoading && !servicios.length ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-txt-muted" />
        </div>
      ) : (
        <div className="grid gap-3">
          {servicios.map((svc) => (
            <div
              key={svc.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                svc.activo
                  ? 'bg-surface border-border hover:border-primary/50'
                  : 'bg-surface-elevated/50 border-border-light opacity-60'
              }`}
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="font-medium text-sm text-txt">{svc.nombre}</div>
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
          ))}
          {servicios.length === 0 && !isAdding && (
            <div className="text-center py-8 text-txt-muted text-sm border border-dashed border-border rounded-xl">
              No hay servicios configurados.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
