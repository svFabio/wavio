import { useState, useMemo, useCallback } from 'react';
import { useCitas } from '../../../shared/hooks/useCitas';
import { useQueryClient } from '@tanstack/react-query';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format } from 'date-fns';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import { useActualizarDescripcionMutation } from '../api/useActualizarDescripcionMutation';
import { useCrearCitaMutation } from '../api/useCrearCitaMutation';
import { useReprogramarCitaMutation } from '../api/useReprogramarCitaMutation';
import { useMarcarAsistenciaMutation } from '../api/useMarcarAsistenciaMutation';
import type { EventoCalendario } from '../types';
import { CalendarioView } from '../components/CalendarioView';

export const CalendarioContainer = () => {
  const { data: dataRaw = [], isLoading: loading } = useCitas();
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
      title: `${cita.clienteNombre || 'Cita sin nombre'}${(cita as any).estadoPago === 'PENDIENTE' ? ' 💰' : ' ✅'}`,
        start,
        end: new Date(start.getTime() + 60 * 60000),
        resource: {
          tipo: 'cita' as const,
          estado: cita.estado,
          estadoPago: (cita as any).estadoPago || 'PENDIENTE',
          telefono: cita.clienteTelefono,
          servicio: cita.servicio || 'Spa',
          servicioId: (cita as any).servicioId,
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
        backgroundColor: 'transparent',
        borderLeftColor: border,
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid' as const,
        borderTop: '1px solid var(--color-border-strong)',
        borderRight: '1px solid var(--color-border-strong)',
        borderBottom: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text)',
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
    }) => {
      const result = await crearCita.mutateAsync(data);
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
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
        <div className="card-modern h-full p-5 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="flex bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60">
                <div className="skeleton w-9 h-9 rounded-md" />
                <div className="skeleton w-12 h-9 rounded-md" />
                <div className="skeleton w-9 h-9 rounded-md" />
              </div>
              <div className="skeleton h-5 w-36 rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="skeleton h-9 w-28 rounded-xl" />
              <div className="flex bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60">
                <div className="skeleton w-16 h-9 rounded-md" />
                <div className="skeleton w-12 h-9 rounded-md" />
              </div>
            </div>
          </div>
          {/* Calendar grid */}
          <div className="flex-1 flex gap-0">
            <div className="w-14 border-r border-border-light">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-[calc(100%/7)] flex items-start justify-end pr-2 pt-1">
                  <div className="skeleton h-2.5 w-8 rounded" />
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(6,1fr)] gap-px bg-border-light">
              {[...Array(42)].map((_, i) => (
                <div key={i} className="bg-surface p-1">
                  {i % 8 === 0 && <div className="skeleton h-5 w-full rounded mb-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
