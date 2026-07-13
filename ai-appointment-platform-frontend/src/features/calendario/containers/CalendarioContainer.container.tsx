import { useState, useMemo, useCallback } from 'react';
import { useCitas } from '../../../shared/hooks/useCitas';
import { useQueryClient } from '@tanstack/react-query';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format } from 'date-fns';
import { useSocketEvent } from '../../../shared/hooks/useSocketEvent';
import { useActualizarDescripcion } from '../api/useActualizarDescripcionMutation';
import { useCrearCita } from '../api/useCrearCitaMutation';
import { useReprogramarCita } from '../api/useReprogramarCitaMutation';
import { useMarcarAsistencia } from '../api/useMarcarAsistenciaMutation';
import type { EventoCalendario } from '../types';
import { CalendarioView } from '../components/CalendarioView';

export const CalendarioContainer = () => {
  const { data: dataRaw = [], isLoading: loading } = useCitas();
  const queryClient = useQueryClient();

  const actualizarDesc = useActualizarDescripcion();
  const crearCita = useCrearCita();
  const reprogramarCita = useReprogramarCita();
  const marcarAsistencia = useMarcarAsistencia();

  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState<View>(Views.MONTH);
  const [citaSeleccionada, setCitaSeleccionada] = useState<EventoCalendario | null>(null);
  const [modalNuevaCita, setModalNuevaCita] = useState<{ isOpen: boolean; fecha?: Date }>({ isOpen: false });
  const [modalReprogramar, setModalReprogramar] = useState<{ isOpen: boolean; cita?: EventoCalendario }>({ isOpen: false });

  const scrollToTime = useMemo(() => {
    if (vista !== Views.DAY) return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const citasDelDia = dataRaw.filter(c => {
      const d = c.fecha.toString().split('T')[0];
      const fechaStr = format(fecha, 'yyyy-MM-dd');
      return d === fechaStr;
    });
    if (citasDelDia.length === 0) return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 8, 0, 0);
    const horaMin = citasDelDia.reduce((min, c) => {
      const [h, m] = c.horario.split(':').map(Number);
      return h * 60 + m < min ? h * 60 + m : min;
    }, Infinity);
    const h = Math.floor(horaMin / 60);
    const m = horaMin % 60;
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), Math.max(0, h - 1), m, 0);
  }, [fecha, vista, dataRaw]);

  const handleCambio = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['citas'] });
  }, [queryClient]);

  useSocketEvent('cambio-citas', handleCambio);

  const eventos = useMemo((): EventoCalendario[] => {
    if (loading && dataRaw.length === 0) return [];
    if (vista === Views.MONTH) {
      const countByDate: Record<string, number> = {};
      dataRaw.forEach(c => {
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
          resource: { tipo: 'resumen' as const, estado: 'INFO', count: count }
        };
      });
    }
    return dataRaw.map(cita => {
      const datePart = cita.fecha.toString().split('T')[0];
      const start = new Date(`${datePart}T${cita.horario}:00`);
      return {
        id: cita.id.toString(),
        title: cita.clienteNombre || `Cita sin nombre`,
        start,
        end: new Date(start.getTime() + 60 * 60000),
        resource: {
          tipo: 'cita' as const,
          estado: cita.estado,
          telefono: cita.clienteTelefono,
          servicio: cita.servicio || 'Spa',
          origen: cita.origen || 'virtual',
          descripcion: cita.descripcion || '',
          citaId: cita.id.toString()
        }
      };
    });
  }, [dataRaw, vista, loading]);

  const eventStyleGetter = (event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      return { className: 'rbc-event-clean' };
    }
    let bg = 'var(--color-surface)';
    let border = 'var(--color-border)';
    switch (event.resource?.estado) {
      case 'CONFIRMADA': border = 'var(--color-success)'; bg = 'var(--color-success-light)'; break;
      case 'VALIDAR': border = 'var(--color-warning)'; bg = 'var(--color-warning-light)'; break;
      case 'PENDIENTE_PAGO': border = 'var(--color-info)'; bg = 'var(--color-info-light)'; break;
      case 'NO_ASISTIO': border = 'var(--color-danger)'; bg = 'var(--color-danger-light)'; break;
    }
    return {
      className: 'shadow-sm rounded-md border-l-4 text-xs',
      style: { backgroundColor: bg, borderColor: border, color: 'var(--color-text)' }
    };
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (vista === Views.MONTH) {
      setFecha(start);
      setVista(Views.DAY);
    } else {
      setModalNuevaCita({ isOpen: true, fecha: start });
    }
  };

  const handleSelectEvent = (event: EventoCalendario) => {
    if (event.resource?.tipo === 'resumen') {
      setFecha(event.start);
      setVista(Views.DAY);
    } else {
      setCitaSeleccionada(event);
    }
  };

  const handleNoAsistio = async () => {
    const citaId = citaSeleccionada?.resource?.citaId;
    if (!citaId) return;
    const esNoAsistio = citaSeleccionada?.resource?.estado === 'NO_ASISTIO';
    await marcarAsistencia.mutateAsync({ citaId, noAsistio: !esNoAsistio });
    setCitaSeleccionada(null);
  };

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
      onNuevaCita={() => setModalNuevaCita({ isOpen: true })}
      citaSeleccionada={citaSeleccionada}
      onCerrarDetalle={() => setCitaSeleccionada(null)}
      onReprogramarDesdeDetalle={() => {
        setModalReprogramar({ isOpen: true, cita: citaSeleccionada! });
        setCitaSeleccionada(null);
      }}
      onNoAsistio={handleNoAsistio}
      onGuardarDescripcion={async (citaId, desc) => {
        const result = await actualizarDesc.mutateAsync({ citaId, descripcion: desc });
        return { success: result.success };
      }}
      modalNuevaCitaAbierto={modalNuevaCita.isOpen}
      fechaInicialNuevaCita={modalNuevaCita.fecha}
      onCerrarNuevaCita={() => setModalNuevaCita({ isOpen: false })}
      onCrearCita={async (data) => {
        const result = await crearCita.mutateAsync(data);
        return { success: result.success, error: result.error };
      }}
      modalReprogramarAbierto={modalReprogramar.isOpen}
      citaReprogramar={modalReprogramar.cita!}
      onCerrarReprogramar={() => setModalReprogramar({ isOpen: false })}
      onReprogramarCita={async (citaId, fecha, horario) => {
        const result = await reprogramarCita.mutateAsync({ citaId, fecha, horario });
        return { success: result.success, error: result.error };
      }}
    />
  );
};
