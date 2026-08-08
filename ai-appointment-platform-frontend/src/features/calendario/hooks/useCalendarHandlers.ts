import { useCallback } from 'react';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import type { EventoCalendario, DatosNuevaCita } from '../types';

export function useCalendarHandlers({
  vista,
  setVista,
  setFecha,
  markNoShow,
  markAsistio,
  citaSeleccionada,
  setCitaSeleccionada,
  queryClient,
  crearCita,
  crearCitaRecurrente,
  reprogramarCita,
  actualizarDesc,
  setModalNuevaCita,
  setModalReprogramar,
}: {
  vista: View;
  setVista: (v: View) => void;
  setFecha: (d: Date) => void;
  markNoShow: UseMutationResult<{ success: boolean; error?: string }, Error, string, unknown>;
  markAsistio: UseMutationResult<{ success: boolean; error?: string }, Error, string, unknown>;
  citaSeleccionada: EventoCalendario | null;
  setCitaSeleccionada: (c: EventoCalendario | null) => void;
  queryClient: QueryClient;
  crearCita: UseMutationResult<
    { success: boolean; error?: string },
    Error,
    DatosNuevaCita,
    unknown
  >;
  crearCitaRecurrente: UseMutationResult<
    { success: boolean; instancesCreated?: number; error?: string },
    Error,
    {
      clienteNombre: string;
      clienteTelefono: string;
      fecha: string;
      horario: string;
      servicioId?: number;
      staffId?: number;
      recurrence: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      recurrenceEnd: string;
    },
    unknown
  >;
  reprogramarCita: UseMutationResult<
    { success: boolean; error?: string },
    Error,
    { citaId: string; fecha: string; horario: string },
    unknown
  >;
  actualizarDesc: UseMutationResult<
    { success: boolean; error?: string },
    Error,
    { citaId: string; descripcion: string },
    unknown
  >;
  setModalNuevaCita: (s: { isOpen: boolean; fecha?: Date }) => void;
  setModalReprogramar: (s: { isOpen: boolean; cita?: EventoCalendario }) => void;
}): {
  handleSelectSlot: (slotInfo: {
    start: Date;
    end: Date;
    action: 'select' | 'click' | 'doubleClick';
  }) => void;
  handleSelectEvent: (event: EventoCalendario) => void;
  handleNoAsistio: () => Promise<void>;
  handleNuevaCita: () => void;
  handleCerrarDetalle: () => void;
  handleReprogramarDesdeDetalle: () => void;
  handleGuardarDescripcion: (citaId: string, descripcion: string) => Promise<{ success: boolean }>;
  handleCerrarNuevaCita: () => void;
  handleCrearCita: (data: DatosNuevaCita) => Promise<{ success: boolean; error?: string }>;
  handleCerrarReprogramar: () => void;
  handleReprogramarCita: (
    citaId: string,
    fecha: string,
    horario: string,
  ) => Promise<{ success: boolean; error?: string }>;
} {
  const handleCambio = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['citas'] });
  }, [queryClient]);

  useSocketEvent('cambio-citas', handleCambio);

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date; end: Date; action: 'select' | 'click' | 'doubleClick' }) => {
      if (vista === Views.MONTH) {
        setFecha(start);
        setVista(Views.DAY);
      } else {
        setModalNuevaCita({ isOpen: true, fecha: start });
      }
    },
    [vista, setFecha, setVista, setModalNuevaCita],
  );

  const handleSelectEvent = useCallback(
    (event: EventoCalendario) => {
      if (event.resource?.tipo === 'resumen') {
        setFecha(event.start);
        setVista(Views.DAY);
      } else {
        setCitaSeleccionada(event);
      }
    },
    [setFecha, setVista, setCitaSeleccionada],
  );

  const handleNoAsistio = useCallback(async () => {
    const citaId = citaSeleccionada?.resource?.citaId;
    if (!citaId) return;
    const esNoAsistio = citaSeleccionada?.resource?.estado === 'NO_ASISTIO';
    if (esNoAsistio) {
      await markAsistio.mutateAsync(citaId);
    } else {
      await markNoShow.mutateAsync(citaId);
    }
    setCitaSeleccionada(null);
  }, [citaSeleccionada, markNoShow, markAsistio, setCitaSeleccionada]);

  const handleNuevaCita = useCallback(
    () => setModalNuevaCita({ isOpen: true }),
    [setModalNuevaCita],
  );

  const handleCerrarDetalle = useCallback(() => setCitaSeleccionada(null), [setCitaSeleccionada]);

  const handleReprogramarDesdeDetalle = useCallback(() => {
    setModalReprogramar({ isOpen: true, cita: citaSeleccionada! });
    setCitaSeleccionada(null);
  }, [citaSeleccionada, setModalReprogramar, setCitaSeleccionada]);

  const handleGuardarDescripcion = useCallback(
    async (citaId: string, desc: string) => {
      const result = await actualizarDesc.mutateAsync({ citaId, descripcion: desc });
      return { success: result.success };
    },
    [actualizarDesc],
  );

  const handleCerrarNuevaCita = useCallback(
    () => setModalNuevaCita({ isOpen: false }),
    [setModalNuevaCita],
  );

  const handleCrearCita = useCallback(
    async (data: DatosNuevaCita) => {
      const { esRecurrente, recurrence, recurrenceEnd, ...baseData } = data;

      if (esRecurrente && recurrence && recurrenceEnd) {
        // UI uses lowercase frequencies (weekly/biweekly/monthly); API contract is UPPERCASE.
        const recurrenceApi = recurrence.toUpperCase() as
          'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
        const result = await crearCitaRecurrente.mutateAsync({
          ...baseData,
          recurrence: recurrenceApi,
          recurrenceEnd,
        });
        return { success: result.success, error: result.error };
      }

      const result = await crearCita.mutateAsync(baseData);
      return { success: result.success, error: result.error };
    },
    [crearCita, crearCitaRecurrente],
  );

  const handleCerrarReprogramar = useCallback(
    () => setModalReprogramar({ isOpen: false }),
    [setModalReprogramar],
  );

  const handleReprogramarCita = useCallback(
    async (citaId: string, fecha: string, horario: string) => {
      const result = await reprogramarCita.mutateAsync({ citaId, fecha, horario });
      return { success: result.success, error: result.error };
    },
    [reprogramarCita],
  );

  return {
    handleSelectSlot,
    handleSelectEvent,
    handleNoAsistio,
    handleNuevaCita,
    handleCerrarDetalle,
    handleReprogramarDesdeDetalle,
    handleGuardarDescripcion,
    handleCerrarNuevaCita,
    handleCrearCita,
    handleCerrarReprogramar,
    handleReprogramarCita,
  };
}
