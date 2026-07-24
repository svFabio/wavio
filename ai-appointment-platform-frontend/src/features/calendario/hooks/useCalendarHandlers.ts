import { useCallback } from 'react';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import type { EventoCalendario, DatosNuevaCita } from '../types';
import type { Cita } from '../../../types';
import { calcularFechasRecurrentes } from './useCalendarEvents';

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
  reprogramarCita,
  actualizarDesc,
  setModalNuevaCita,
  setModalReprogramar,
}: {
  vista: View;
  setVista: (v: View) => void;
  setFecha: (d: Date) => void;
  dataRaw: Cita[];
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
        const fechas = calcularFechasRecurrentes(data.fecha, recurrence, recurrenceEnd);
        let errors = 0;

        for (const fecha of fechas) {
          const result = await crearCita.mutateAsync({ ...baseData, fecha });
          if (!result.success) errors++;
        }

        if (errors > 0) {
          return { success: false, error: `Error al crear ${errors} cita(s) recurrente(s)` };
        }
        return { success: true };
      }

      const result = await crearCita.mutateAsync(baseData);
      return { success: result.success, error: result.error };
    },
    [crearCita],
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
