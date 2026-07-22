import { Clock, DollarSign } from 'lucide-react';

interface NewServiceData {
  nombre: string;
  categoria: string;
  duracionMinutos: number;
  bufferMinutos: number;
  precio: number;
}

interface ServiceFormProps {
  newService: NewServiceData;
  setNewService: (service: NewServiceData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ServiceForm = ({
  newService,
  setNewService,
  onSubmit,
  onCancel,
  isLoading,
}: ServiceFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4"
    >
      <h4 className="text-sm font-medium text-txt">Agregar nuevo servicio</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Nombre</label>
          <input
            required
            value={newService.nombre}
            onChange={(e) => setNewService({ ...newService, nombre: e.target.value })}
            placeholder="Ej. Masaje Relajante"
            className="input-modern"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Categoría (opcional)</label>
          <input
            value={newService.categoria}
            onChange={(e) => setNewService({ ...newService, categoria: e.target.value })}
            placeholder="Ej. Faciales"
            className="input-modern"
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
              className="input-modern pl-9"
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
              className="input-modern pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-txt-muted font-medium">Precio</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              required
              value={newService.precio}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setNewService({ ...newService, precio: val ? Number(val) : 0 });
              }}
              className="input-modern pl-9"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-txt-muted hover:text-txt transition-colors"
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          Guardar Servicio
        </button>
      </div>
    </form>
  );
};
