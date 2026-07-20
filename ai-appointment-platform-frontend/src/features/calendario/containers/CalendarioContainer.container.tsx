import { useState, useMemo, useCallback } from 'react';
import { useCitasQuery } from '../api/useCitasQuery';
import { useQueryClient } from '@tanstack/react-query';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, addWeeks, addMonths } from 'date-fns';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import { useActualizarDescripcionMutation } from '../api/useActualizarDescripcionMutation';
import { useCrearCitaMutation } from '../api/useCrearCitaMutation';
import { useReprogramarCitaMutation } from '../api/useReprogramarCitaMutation';
import { useMarcarAsistenciaMutation } from '../api/useMarcarAsistenciaMutation';
import type { EventoCalendario } from '../types';
import { CalendarioView } from '../components/CalendarioView';
import { CalendarioSkeleton } from '../../../shared/components/skeletons/CalendarioSkeleton';

function calcularFechasRecurrentes(
  fechaInicio: string,
  frecuencia: 'weekly' | 'biweekly' | 'monthly',
  fechaFin: string
): string[] {
  const fechas: string[] = [];
  let current = new Date(`${fechaInicio}T00:00:00`);
  const end = new Date(`${fechaFin}T23:59:59`);
  
  while (current <= end) {
    fechas.push(format(current, 'yyyy-MM-dd'));
    if (frecuencia === 'weekly') current = addWeeks(current, 1);
    else if (frecuencia === 'biweekly') current = addWeeks(current, 2);
    else current = addMonths(current, 1);
  }
  return fechas;
}

export const CalendarioContainer = () => {
  const { data: dataRaw = [], isLoading: loading } = useCitasQuery();
  const queryClient = useQueryClient();

  const actualizarDesc = useActualizarDescripcionMutation();
  const crearCita = useCrearCitaMutation();
  const reprogramarCita = useReprogramarCitaMutation();
  const marcarAsistencia = useMarcarAsistenciaMutation();

  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState<View>(Views.MONTH);
  const [citaSeleccionada, setCitaSeleccionada] = useState<EventoCalendario | null>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<{ isOpen: boolean; fecha?: Date }>({
    isOpen: false,
  });
  const [modalReprogramar, setModalReprogramar] = useState<{
    isOpen: boolean;
    cita?: EventoCalendario;
  }>({ isOpen: false });

  const scrollToTime = useMemo(() => {
    if (vista !== Views.DAY)
      return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const citasDelDia = dataRaw.filter((c) => {
      const d = c.fecha.toString().split('T')[0];
      const fechaStr = format(fecha, 'yyyy-MM-dd');
      return d === fechaStr;
    });
    if (citasDelDia.length === 0)
      return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const horaMin = citasDelDia.reduce((min, c) => {
      const [h, m] = c.horario.split(':').map(Number);
      return h * 60 + m < min ? h * 60 + m : min;
    }, Infinity);
    const h = Math.floor(horaMin / 60);
    const m = horaMin % 60;
    return new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      Math.max(0, h - 1),
      m,
      0,
    );
  }, [fecha, vista, dataRaw]);

  const handleCambio = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['citas'] });
  }, [queryClient]);

  useSocketEvent('cambio-citas', handleCambio);

  const eventos = useMemo((): EventoCalendario[] => {
    if (loading && dataRaw.length === 0) return [];
    if (vista === Views.MONTH) {
      const countByDate: Record<string, number> = {};
      dataRaw.forEach((c) => {
        const d = c.fecha.toString().split('T')[0];
        countByDate[d] = (countByDate[d] || 0) + 1;
      });
      return Object.entries(countByDate).map(([dateStr, count]) => {
        const start = new Date(`${dateStr}T00:00:00`);
        return {
          id: `sum-${dateStr}`,
          title: `${count} cita${count > 1 ? 's' : ''}`,
          start,
          end: new Date(start),
          allDay: true,
          resource: { tipo: 'resumen' as const, estado: 'INFO', count: count },
        };
      });
    }
    return dataRaw.map((cita) => {
      const datePart = cita.fecha.toString().split('T')[0];
      const start = new Date(`${datePart}T${cita.horario}:00`);
      return {
        id: cita.id.toString(),
        title: cita.clienteNombre || 'Cita sin nombre',
        start,
        end: new Date(start.getTime() + 60 * 60000),
        resource: {
          tipo: 'cita' as const,
          estado: cita.estado,
          estadoPago: cita.estadoPago || 'PENDIENTE',
          telefono: cita.clienteTelefono,
          servicio: cita.servicio || 'Spa',
          servicioId: cita.servicioId,
          origen: cita.origen || 'virtual',
          descripcion: cita.descripcion || '',
          citaId: cita.id.toString(),
        },
      };
    });
  }, [dataRaw, vista, loading]);

  const eventStyleGetter = useCallback((event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      return { className: '' };
    }

    // Asignar un color vibrante (incluyendo ámbar) basado en el nombre del cliente
    const title = event.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = (Math.abs(hash) % 6) + 1; // 1 to 6

    const border = `var(--color-event-${colorIndex}-bg)`; // Usamos el color vibrante base para el borde

    return {
      style: {
        backgroundColor: 'var(--color-surface-elevated)',
        borderLeftColor: border,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid' as const,
        borderTop: `2px solid ${border}`,
        borderRight: `2px solid ${border}`,
        borderBottom: `2px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-event)',
      },
    };
  }, []);

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      if (vista === Views.MONTH) {
        setFecha(start);
        setVista(Views.DAY);
      } else {
        setModalNuevaCita({ isOpen: true, fecha: start });
      }
    },
    [vista],
  );

  const handleSelectEvent = useCallback((event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      setFecha(event.start);
      setVista(Views.DAY);
    } else {
      setCitaSeleccionada(event);
    }
  }, []);

  const handleNoAsistio = useCallback(async () => {
    const citaId = citaSeleccionada?.resource?.citaId;
    if (!citaId) return;
    const esNoAsistio = citaSeleccionada?.resource?.estado === 'NO_ASISTIO';
    await marcarAsistencia.mutateAsync({ citaId, noAsistio: !esNoAsistio });
    setCitaSeleccionada(null);
  }, [citaSeleccionada, marcarAsistencia]);

  const handleNuevaCita = useCallback(() => setModalNuevaCita({ isOpen: true }), []);

  const handleCerrarDetalle = useCallback(() => setCitaSeleccionada(null), []);

  const handleReprogramarDesdeDetalle = useCallback(() => {
    setModalReprogramar({ isOpen: true, cita: citaSeleccionada! });
    setCitaSeleccionada(null);
  }, [citaSeleccionada]);

  const handleGuardarDescripcion = useCallback(
    async (citaId: string, desc: string) => {
      const result = await actualizarDesc.mutateAsync({ citaId, descripcion: desc });
      return { success: result.success };
    },
    [actualizarDesc],
  );

  const handleCerrarNuevaCita = useCallback(() => setModalNuevaCita({ isOpen: false }), []);

  const handleCrearCita = useCallback(
    async (data: {
      clienteNombre: string;
      clienteTelefono: string;
      fecha: string;
      horario: string;
      servicioId?: number;
      staffId?: number;
      esRecurrente?: boolean;
      recurrence?: 'weekly' | 'biweekly' | 'monthly';
      recurrenceEnd?: string;
    }) => {
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


  const handleCerrarReprogramar = useCallback(() => setModalReprogramar({ isOpen: false }), []);

  const handleReprogramarCita = useCallback(
    async (citaId: string, fecha: string, horario: string) => {
      const result = await reprogramarCita.mutateAsync({ citaId, fecha, horario });
      return { success: result.success, error: result.error };
    },
    [reprogramarCita],
  );

  if (loading && dataRaw.length === 0) {
    return <CalendarioSkeleton />;
  }

  return (
    <CalendarioView
      eventos={eventos}
      vista={vista}
      fecha={fecha}
      scrollToTime={scrollToTime}
      eventStyleGetter={eventStyleGetter}
      onNavigateFecha={setFecha}
      onNavigateVista={setVista}
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      onNuevaCita={handleNuevaCita}
      citaSeleccionada={citaSeleccionada}
      onCerrarDetalle={handleCerrarDetalle}
      onReprogramarDesdeDetalle={handleReprogramarDesdeDetalle}
      onNoAsistio={handleNoAsistio}
      onGuardarDescripcion={handleGuardarDescripcion}
      modalNuevaCitaAbierto={modalNuevaCita.isOpen}
      fechaInicialNuevaCita={modalNuevaCita.fecha}
      onCerrarNuevaCita={handleCerrarNuevaCita}
      onCrearCita={handleCrearCita}
      modalReprogramarAbierto={modalReprogramar.isOpen}
      citaReprogramar={modalReprogramar.cita!}
      onCerrarReprogramar={handleCerrarReprogramar}
      onReprogramarCita={handleReprogramarCita}
    />
  );
};
