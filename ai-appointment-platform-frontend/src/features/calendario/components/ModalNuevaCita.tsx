import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useHorariosDisponibles } from '../../../shared/hooks/useHorariosDisponibles';
import {
  X,
  Plus,
  User,
  Phone,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface DatosNuevaCita {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
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
  onSubmit
}: ModalNuevaCitaProps) => {
  const [formData, setFormData] = useState<DatosNuevaCita>({
    clienteNombre: '',
    clienteTelefono: '',
    fecha: fechaInicial ? format(fechaInicial, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    horario: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: horariosDisponibles = [], isLoading: loadingHorarios } = useHorariosDisponibles(
    formData.fecha,
    isOpen && !!formData.fecha
  );

  useEffect(() => {
    if (isOpen && fechaInicial) {
      setFormData(prev => ({
        ...prev,
        fecha: format(fechaInicial, 'yyyy-MM-dd'),
        horario: ''
      }));
    }
  }, [isOpen, fechaInicial]);

  useEffect(() => {
    if (isOpen && !horariosDisponibles.includes(formData.horario)) {
      setFormData(prev => ({ ...prev, horario: '' }));
    }
  }, [isOpen, horariosDisponibles, formData.horario]);

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
      setFormData({ clienteNombre: '', clienteTelefono: '', fecha: format(new Date(), 'yyyy-MM-dd'), horario: '' });
      onClose();
    } else {
      setError(result.error || 'Error al crear la cita');
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({ clienteNombre: '', clienteTelefono: '', fecha: format(new Date(), 'yyyy-MM-dd'), horario: '' });
    onClose();
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, clienteTelefono: valor }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-modern w-full max-w-md overflow-hidden animate-modal-pop shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-elevated/30">
          <h3 className="font-bold text-lg text-txt flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nueva Cita
          </h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors">
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
            <label className="block text-sm font-semibold text-txt mb-1.5">Nombre del Cliente *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
              <input
                type="text"
                required
                value={formData.clienteNombre}
                onChange={(e) => setFormData(prev => ({ ...prev, clienteNombre: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input-modern pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt mb-1.5">Horario *</label>
            {loadingHorarios ? (
              <div className="flex items-center justify-center py-4 text-txt-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando horarios...
              </div>
            ) : horariosDisponibles.length === 0 ? (
              <div className="p-3 bg-warning-light border border-warning/20 rounded-xl text-warning-dark text-sm">
                No hay horarios disponibles hoy
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {horariosDisponibles.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, horario: h }))}
                    className={`py-2 px-1 rounded-lg font-semibold text-xs transition-all ${formData.horario === h
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                      : 'bg-surface-elevated text-txt-secondary hover:bg-border-light'
                      }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
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
