import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useModalAccessibility } from '../../../shared/hooks/useModalAccessibility';
import { useHorariosDisponiblesQuery } from '../api/useHorariosDisponiblesQuery';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import {
  X,
  Plus,
  User,
  Phone,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  Scissors,
} from 'lucide-react';
import { HorariosGrid } from './HorariosGrid';
import { ResumenPrecio } from './ResumenPrecio';

interface DatosNuevaCita {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
  servicioId?: number;
}

interface ModalNuevaCitaProps {
  isOpen: boolean;
  onClose: () => void;
  fechaInicial?: Date;
  onSubmit: (data: DatosNuevaCita) => Promise<{ success: boolean; error?: string }>;
}

export const ModalNuevaCita = ({
  isOpen,
  onClose,
  fechaInicial,
  onSubmit,
}: ModalNuevaCitaProps) => {
  const [formData, setFormData] = useState<DatosNuevaCita>({
    clienteNombre: '',
    clienteTelefono: '',
    fecha: fechaInicial ? format(fechaInicial, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    horario: '',
    servicioId: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: api.getServicios,
  });

  const { data: config } = useQuery({
    queryKey: ['configuracion'],
    queryFn: api.getConfiguracion,
  });

  const { data: horariosDisponibles = [], isLoading: loadingHorarios } =
    useHorariosDisponiblesQuery(formData.fecha, isOpen && !!formData.fecha, formData.servicioId);

  const { handleKeyDown } = useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
  });

  useEffect(() => {
    if (isOpen && fechaInicial) {
      setFormData((prev) => ({
        ...prev,
        fecha: format(fechaInicial, 'yyyy-MM-dd'),
        horario: '',
      }));
    }
  }, [isOpen, fechaInicial]);

  useEffect(() => {
    if (isOpen && !horariosDisponibles.includes(formData.horario)) {
      setFormData((prev) => ({ ...prev, horario: '' }));
    }
  }, [isOpen, horariosDisponibles, formData.horario]);

  // Set initial service
  useEffect(() => {
    if (servicios.length > 0 && !formData.servicioId) {
      setFormData((prev) => ({ ...prev, servicioId: servicios[0].id }));
    }
  }, [servicios, formData.servicioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.clienteNombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (formData.clienteTelefono.length < 8) {
      setError('El telefono debe tener al menos 8 digitos.');
      return;
    }

    setLoading(true);
    const result = await onSubmit(formData);
    setLoading(false);

    if (result.success) {
      setFormData({
        clienteNombre: '',
        clienteTelefono: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        horario: '',
        servicioId: servicios[0]?.id,
      });
      onClose();
    } else {
      setError(result.error || 'Error al crear la cita');
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      clienteNombre: '',
      clienteTelefono: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      horario: '',
      servicioId: servicios[0]?.id,
    });
    onClose();
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, clienteTelefono: valor }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nueva cita"
        onKeyDown={handleKeyDown}
        className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nueva Cita
          </h3>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-txt-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger-light border border-danger/20 rounded-xl text-danger text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">
              Nombre del Cliente *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="text"
                required
                value={formData.clienteNombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, clienteNombre: e.target.value }))
                }
                className="input-modern pl-10"
                placeholder="Ej: Juan Perez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Telefono *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="tel"
                required
                value={formData.clienteTelefono}
                onChange={handleTelefonoChange}
                className="input-modern pl-10"
                placeholder="Ej: 591 70000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">Fecha *</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input-modern pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-txt mb-1.5">Servicio</label>
              <div className="relative">
                <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
                <select
                  value={formData.servicioId || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, servicioId: Number(e.target.value) }))
                  }
                  className="input-modern pl-10 appearance-none bg-surface"
                >
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — ${s.precio} ({s.duracionMinutos} min)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ResumenPrecio servicioId={formData.servicioId} servicios={servicios} config={config} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Horario *</label>
            <HorariosGrid
              horarios={horariosDisponibles}
              selected={formData.horario}
              onSelect={(h) => setFormData((prev) => ({ ...prev, horario: h }))}
              loading={loadingHorarios}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.horario}
              className="btn-primary flex-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
