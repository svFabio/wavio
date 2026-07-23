import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useHorariosDisponiblesQuery } from '../api/useHorariosDisponiblesQuery';
import { ModalNuevaCita } from '../components/ModalNuevaCita';
import type { DatosNuevaCita } from '../types';

interface ModalNuevaCitaContainerProps {
  isOpen: boolean;
  onClose: () => void;
  fechaInicial?: Date;
  onSubmit: (data: DatosNuevaCita) => Promise<{ success: boolean; error?: string }>;
}

export const ModalNuevaCitaContainer = ({
  isOpen,
  onClose,
  fechaInicial,
  onSubmit,
}: ModalNuevaCitaContainerProps): JSX.Element | null => {
  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: api.getServicios,
    enabled: isOpen,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    enabled: isOpen,
  });

  const { data: config } = useQuery({
    queryKey: ['configuracion'],
    queryFn: api.getConfiguracion,
    enabled: isOpen,
  });

  const fechaFormat = fechaInicial
    ? fechaInicial.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const { data: horariosDisponibles = [], isLoading: loadingHorarios } =
    useHorariosDisponiblesQuery(
      fechaFormat,
      isOpen,
      servicios.length > 0 ? servicios[0].id : undefined,
    );

  if (!isOpen) return null;

  return (
    <ModalNuevaCita
      isOpen={isOpen}
      onClose={onClose}
      fechaInicial={fechaInicial}
      onSubmit={onSubmit}
      servicios={servicios}
      staffList={staffList}
      config={config}
      horariosDisponibles={horariosDisponibles}
      loadingHorarios={loadingHorarios}
    />
  );
};
