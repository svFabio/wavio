import { useState } from 'react';
import { format } from 'date-fns';
import { useHorariosDisponiblesQuery } from '../api/useHorariosDisponiblesQuery';
import { ModalReprogramar } from '../components/ModalReprogramar';
import type { EventoCalendario } from '../types';

interface ModalReprogramarContainerProps {
  isOpen: boolean;
  onClose: () => void;
  cita: EventoCalendario;
  onSubmit: (
    citaId: string,
    fecha: string,
    horario: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ModalReprogramarContainer = ({
  isOpen,
  onClose,
  cita,
  onSubmit,
}: ModalReprogramarContainerProps): React.JSX.Element => {
  const initialFecha = format(cita.start, 'yyyy-MM-dd');
  const [fecha, setFecha] = useState(initialFecha);
  const [horario, setHorario] = useState(format(cita.start, 'HH:mm'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: horariosDisponibles = [], isLoading: loadingHorarios } =
    useHorariosDisponiblesQuery(fecha, isOpen, cita.resource?.servicioId);

  // Clear a stale selection when the picked date no longer offers it
  // (render-time adjustment pattern — no useEffect state syncing).
  if (isOpen && fecha !== initialFecha && !horariosDisponibles.includes(horario)) {
    setHorario('');
  }

  const handleSubmit = async (): Promise<void> => {
    setSaving(true);
    setError(null);

    const result = await onSubmit(cita.id, fecha, horario);
    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al reprogramar');
    }
  };

  return (
    <ModalReprogramar
      isOpen={isOpen}
      onClose={onClose}
      cita={cita}
      fecha={fecha}
      onFechaChange={setFecha}
      horario={horario}
      onHorarioChange={setHorario}
      horariosDisponibles={horariosDisponibles}
      loadingHorarios={loadingHorarios}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
    />
  );
};
