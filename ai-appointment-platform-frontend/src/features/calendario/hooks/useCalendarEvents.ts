import { useMemo, useCallback } from 'react';
import { Views } from 'react-big-calendar';
import { format, addWeeks, addMonths } from 'date-fns';
import type { View } from 'react-big-calendar';
import type { Cita } from '../../../types';
import type { EventoCalendario } from '../types';

function calcularFechasRecurrentes(
  fechaInicio: string,
  frecuencia: 'weekly' | 'biweekly' | 'monthly',
  fechaFin: string,
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

export function useCalendarEvents({
  dataRaw,
  vista,
  fecha,
  loading,
}: {
  dataRaw: Cita[];
  vista: View;
  fecha: Date;
  loading: boolean;
}): {
  eventos: EventoCalendario[];
  scrollToTime: Date;
  eventStyleGetter: (
    event: EventoCalendario,
    start: Date,
    end: Date,
    isSelected: boolean,
  ) => { style: React.CSSProperties };
} {
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

    const title = event.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = (Math.abs(hash) % 6) + 1;

    const border = `var(--color-event-${colorIndex}-bg)`;

    return {
      style: {
        backgroundColor: 'var(--color-surface-elevated)',
        borderLeftColor: border,
        borderLeftWidth: 'var(--border-width-thick, 4px)',
        borderLeftStyle: 'solid' as const,
        borderTop: `var(--border-width-default, 2px) solid ${border}`,
        borderRight: `var(--border-width-default, 2px) solid ${border}`,
        borderBottom: `var(--border-width-default, 2px) solid ${border}`,
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-event)',
      },
    };
  }, []);

  return { eventos, scrollToTime, eventStyleGetter };
}

export { calcularFechasRecurrentes };
