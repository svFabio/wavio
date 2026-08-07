import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Views } from 'react-big-calendar';
import { useCalendarEvents } from '../useCalendarEvents';
import type { Cita } from '../../../../types';

const mockCita: Cita = {
  id: '1',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '1234567890',
  fecha: '2026-01-10',
  horario: '10:00',
  servicio: 'Corte',
  estado: 'CONFIRMADA',
  estadoPago: 'PAGADO',
  origen: 'virtual',
  descripcion: 'Nota',
  creadoEn: '2026-01-01T00:00:00Z',
};

const mockCita2: Cita = {
  id: '2',
  clienteNombre: 'María García',
  clienteTelefono: '9876543210',
  fecha: '2026-01-10',
  horario: '14:00',
  servicio: 'Spa',
  estado: 'PENDIENTE_PAGO',
  origen: 'presencial',
  creadoEn: '2026-01-01T00:00:00Z',
};

const noon = (dateStr: string) => new Date(`${dateStr}T12:00:00`);

describe('useCalendarEvents', () => {
  it('returns empty eventos when loading with no data', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [],
        vista: Views.MONTH,
        fecha: noon('2026-01-10'),
        loading: true,
      }),
    );
    expect(result.current.eventos).toEqual([]);
  });

  it('groups events by date in month view', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [mockCita, mockCita2],
        vista: Views.MONTH,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    expect(result.current.eventos).toHaveLength(1);
    expect(result.current.eventos[0].title).toBe('2 citas');
    expect(result.current.eventos[0].resource).toEqual({
      tipo: 'resumen',
      estado: 'INFO',
      count: 2,
    });
  });

  it('creates individual events in week/day view', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [mockCita, mockCita2],
        vista: Views.WEEK,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    expect(result.current.eventos).toHaveLength(2);
    expect(result.current.eventos[0].resource?.tipo).toBe('cita');
    expect(result.current.eventos[0].resource?.citaId).toBe('1');
    expect(result.current.eventos[1].resource?.citaId).toBe('2');
  });

  it('sets correct start/end dates for individual events', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [mockCita],
        vista: Views.WEEK,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    const event = result.current.eventos[0];
    expect(event.start.getHours()).toBe(10);
    expect(event.start.getMinutes()).toBe(0);
    expect(event.end.getTime() - event.start.getTime()).toBe(60 * 60000);
  });

  it('computes scrollToTime for day view with earliest cita', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [mockCita, mockCita2],
        vista: Views.DAY,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    const hours = result.current.scrollToTime.getHours();
    expect(hours).toBeLessThanOrEqual(9);
    expect(result.current.scrollToTime.getMinutes()).toBe(0);
  });

  it('returns 8am scrollToTime when no citas on day view', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [],
        vista: Views.DAY,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    expect(result.current.scrollToTime.getHours()).toBe(8);
    expect(result.current.scrollToTime.getMinutes()).toBe(0);
  });

  it('returns 8am scrollToTime for non-day view', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({
        dataRaw: [mockCita],
        vista: Views.MONTH,
        fecha: noon('2026-01-10'),
        loading: false,
      }),
    );
    expect(result.current.scrollToTime.getHours()).toBe(8);
  });

  it('eventStyleGetter returns style for resumen events', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({ dataRaw: [], vista: Views.MONTH, fecha: new Date(), loading: false }),
    );
    const resumenEvent = {
      id: 'sum-2026-01-10',
      title: '3 citas',
      start: new Date(),
      end: new Date(),
      allDay: true,
      resource: { tipo: 'resumen' as const, estado: 'INFO', count: 3 },
    };
    const style = result.current.eventStyleGetter(resumenEvent, new Date(), new Date(), false);
    expect(style.style.cursor).toBe('pointer');
    expect(style.style.fontWeight).toBe(600);
  });

  it('eventStyleGetter returns style for individual events', () => {
    const { result } = renderHook(() =>
      useCalendarEvents({ dataRaw: [], vista: Views.MONTH, fecha: new Date(), loading: false }),
    );
    const citaEvent = {
      id: '1',
      title: 'Test',
      start: new Date(),
      end: new Date(),
      resource: { tipo: 'cita' as const, estado: 'CONFIRMADA' },
    };
    const style = result.current.eventStyleGetter(citaEvent, new Date(), new Date(), false);
    expect(style.style.borderLeftColor).toBeDefined();
  });
});
