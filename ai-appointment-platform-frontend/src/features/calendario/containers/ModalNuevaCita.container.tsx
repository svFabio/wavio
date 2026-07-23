import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useHorariosDisponiblesQuery } from '../api/useHorariosDisponiblesQuery';
import { useModalAccessibility } from '../../../shared/hooks/useModalAccessibility';
import { ModalNuevaCita } from '../components/ModalNuevaCita';
import { ModalNuevaCitaForm } from '../components/ModalNuevaCitaForm';
import type { DatosNuevaCita } from '../types';

interface ModalNuevaCitaContainerProps {
  isOpen: boolean;
  onClose: () => void;
  fechaInicial?: Date;
  onSubmit: (data: DatosNuevaCita) => Promise<{ success: boolean; error?: string }>;
}

const makeEmptyForm = (servicioId?: number): DatosNuevaCita => ({
  clienteNombre: '',
  clienteTelefono: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  horario: '',
  servicioId,
  staffId: undefined,
  esRecurrente: false,
  recurrence: undefined,
  recurrenceEnd: undefined,
});

export const ModalNuevaCitaContainer = ({
  isOpen,
  onClose,
  fechaInicial,
  onSubmit,
}: ModalNuevaCitaContainerProps): React.JSX.Element | null => {
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

  const [formData, setFormData] = useState<DatosNuevaCita>(makeEmptyForm(servicios[0]?.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { handleKeyDown } = useModalAccessibility({
    isOpen,
    onClose,
    modalRef,
    triggerRef,
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

  useEffect(() => {
    if (servicios.length > 0 && !formData.servicioId) {
      setFormData((prev) => ({ ...prev, servicioId: servicios[0].id }));
    }
  }, [servicios, formData.servicioId]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        setFormData(makeEmptyForm(servicios[0]?.id));
        onClose();
      } else {
        setError(result.error || 'Error al crear la cita');
      }
    } catch (err) {
      setError('Error inesperado: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setError(null);
    setFormData(makeEmptyForm(servicios[0]?.id));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalNuevaCita
      modalRef={modalRef}
      handleKeyDown={handleKeyDown}
      handleClose={handleClose}
      isLarge={!!formData.esRecurrente}
    >
      <ModalNuevaCitaForm
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        handleClose={handleClose}
        loading={loading}
        error={error}
        servicios={servicios}
        staffList={staffList}
        config={config}
        horariosDisponibles={horariosDisponibles}
        loadingHorarios={loadingHorarios}
      />
    </ModalNuevaCita>
  );
};
