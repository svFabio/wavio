import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { Servicio } from '../types';
import { ServiceForm } from './ServiceForm';
import { ServiceCard } from './ServiceCard';

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
        <ServiceForm
          newService={newService}
          setNewService={setNewService}
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAdding(false)}
          isLoading={isLoading}
        />
      )}

      {isLoading && !servicios.length ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-txt-muted" />
        </div>
      ) : (
        <div className="grid gap-3">
          {servicios.map((svc) => (
            <ServiceCard
              key={svc.id}
              svc={svc}
              formatDuration={formatDuration}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isLoading={isLoading}
            />
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
