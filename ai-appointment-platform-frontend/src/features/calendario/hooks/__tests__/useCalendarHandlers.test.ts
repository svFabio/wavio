import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Views } from 'react-big-calendar';
import { useCalendarHandlers } from '../useCalendarHandlers';
import { createTestQueryClient } from '../../../../test-utils';
import type { EventoCalendario } from '../../types';

vi.mock('../../../../shared/hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

function createMockMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutateAsync: vi.fn(),
    isPending: false,
    ...overrides,
  } as any;
}

function setup(opts: {
  vista?: any;
  citaSeleccionada?: EventoCalendario | null;
  markNoShow?: any;
  markAsistio?: any;
  crearCita?: any;
  reprogramarCita?: any;
  actualizarDesc?: any;
}) {
  const setVista = vi.fn();
  const setCitaSeleccionada = vi.fn();
  const setModalNuevaCita = vi.fn();
  const setModalReprogramar = vi.fn();
  const queryClient = createTestQueryClient();
  const setFecha = vi.fn();

  const { result } = renderHook(() =>
    useCalendarHandlers({
      vista: opts.vista ?? Views.MONTH,
      setVista,
      markNoShow: opts.markNoShow ?? createMockMutation(),
      markAsistio: opts.markAsistio ?? createMockMutation(),
      citaSeleccionada: opts.citaSeleccionada ?? null,
      setCitaSeleccionada,
      queryClient,
      crearCita: opts.crearCita ?? createMockMutation(),
      reprogramarCita: opts.reprogramarCita ?? createMockMutation(),
      actualizarDesc: opts.actualizarDesc ?? createMockMutation(),
      setModalNuevaCita,
      setModalReprogramar,
      setFecha,
    }),
  );

  return {
    result,
    setVista,
    setFecha,
    setCitaSeleccionada,
    setModalNuevaCita,
    setModalReprogramar,
    queryClient,
  };
}

describe('useCalendarHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSelectSlot', () => {
    it('switches to day view when clicking a slot in month view', () => {
      const { result, setVista, setFecha } = setup({ vista: Views.MONTH });
      const slotDate = new Date('2026-01-15');
      act(() => {
        result.current.handleSelectSlot({
          start: slotDate,
          end: slotDate,
          action: 'select',
        });
      });
      expect(setFecha).toHaveBeenCalledWith(slotDate);
      expect(setVista).toHaveBeenCalledWith(Views.DAY);
    });

    it('opens nueva cita modal when clicking a slot in day view', () => {
      const { result, setModalNuevaCita } = setup({ vista: Views.DAY });
      const slotDate = new Date('2026-01-15T10:00:00');
      act(() => {
        result.current.handleSelectSlot({
          start: slotDate,
          end: slotDate,
          action: 'select',
        });
      });
      expect(setModalNuevaCita).toHaveBeenCalledWith({ isOpen: true, fecha: slotDate });
    });
  });

  describe('handleSelectEvent', () => {
    it('navigates to day view on resumen event', () => {
      const { result, setVista } = setup({ vista: Views.MONTH });
      const event: EventoCalendario = {
        id: 'sum-2026-01-10',
        title: '3 citas',
        start: new Date('2026-01-10'),
        end: new Date('2026-01-10'),
        allDay: true,
        resource: { tipo: 'resumen', estado: 'INFO' },
      };
      act(() => {
        result.current.handleSelectEvent(event);
      });
      expect(setVista).toHaveBeenCalledWith(Views.DAY);
    });

    it('sets selected cita on individual event', () => {
      const { result, setCitaSeleccionada } = setup({ vista: Views.MONTH });
      const event: EventoCalendario = {
        id: '1',
        title: 'Juan',
        start: new Date(),
        end: new Date(),
        resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1' },
      };
      act(() => {
        result.current.handleSelectEvent(event);
      });
      expect(setCitaSeleccionada).toHaveBeenCalledWith(event);
    });
  });

  describe('handleNoAsistio', () => {
    it('calls markNoShow for a CONFIRMADA cita', async () => {
      const markNoShow = createMockMutation({
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      });
      const markAsistio = createMockMutation({ mutateAsync: vi.fn() });
      const event: EventoCalendario = {
        id: '1',
        title: 'Test',
        start: new Date(),
        end: new Date(),
        resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1' },
      };
      const { result, setCitaSeleccionada } = setup({
        citaSeleccionada: event,
        markNoShow,
        markAsistio,
      });
      await act(async () => {
        await result.current.handleNoAsistio();
      });
      expect(markNoShow.mutateAsync).toHaveBeenCalledWith('1');
      expect(setCitaSeleccionada).toHaveBeenCalledWith(null);
    });

    it('calls markAsistio for a NO_ASISTIO cita', async () => {
      const markNoShow = createMockMutation({ mutateAsync: vi.fn() });
      const markAsistio = createMockMutation({
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      });
      const event: EventoCalendario = {
        id: '1',
        title: 'Test',
        start: new Date(),
        end: new Date(),
        resource: { tipo: 'cita', estado: 'NO_ASISTIO', citaId: '1' },
      };
      const { result, setCitaSeleccionada } = setup({
        citaSeleccionada: event,
        markNoShow,
        markAsistio,
      });
      await act(async () => {
        await result.current.handleNoAsistio();
      });
      expect(markAsistio.mutateAsync).toHaveBeenCalledWith('1');
      expect(setCitaSeleccionada).toHaveBeenCalledWith(null);
    });

    it('does nothing when no cita is selected', async () => {
      const markNoShow = createMockMutation({ mutateAsync: vi.fn() });
      const { result } = setup({ citaSeleccionada: null, markNoShow });
      await act(async () => {
        await result.current.handleNoAsistio();
      });
      expect(markNoShow.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('handleNuevaCita', () => {
    it('opens nueva cita modal', () => {
      const { result, setModalNuevaCita } = setup({});
      act(() => {
        result.current.handleNuevaCita();
      });
      expect(setModalNuevaCita).toHaveBeenCalledWith({ isOpen: true });
    });
  });

  describe('handleCerrarDetalle', () => {
    it('clears selected cita', () => {
      const { result, setCitaSeleccionada } = setup({});
      act(() => {
        result.current.handleCerrarDetalle();
      });
      expect(setCitaSeleccionada).toHaveBeenCalledWith(null);
    });
  });

  describe('handleReprogramarDesdeDetalle', () => {
    it('opens reprogramar modal and clears selection', () => {
      const event: EventoCalendario = {
        id: '1',
        title: 'Test',
        start: new Date(),
        end: new Date(),
        resource: { tipo: 'cita', estado: 'CONFIRMADA' },
      };
      const { result, setModalReprogramar, setCitaSeleccionada } = setup({
        citaSeleccionada: event,
      });
      act(() => {
        result.current.handleReprogramarDesdeDetalle();
      });
      expect(setModalReprogramar).toHaveBeenCalledWith({ isOpen: true, cita: event });
      expect(setCitaSeleccionada).toHaveBeenCalledWith(null);
    });
  });

  describe('handleGuardarDescripcion', () => {
    it('calls actualizarDesc and returns result', async () => {
      const actualizarDesc = createMockMutation({
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      });
      const { result } = setup({ actualizarDesc });
      const response = await result.current.handleGuardarDescripcion('1', 'nueva nota');
      expect(actualizarDesc.mutateAsync).toHaveBeenCalledWith({
        citaId: '1',
        descripcion: 'nueva nota',
      });
      expect(response).toEqual({ success: true });
    });
  });

  describe('handleCerrarNuevaCita', () => {
    it('closes nueva cita modal', () => {
      const { result, setModalNuevaCita } = setup({});
      act(() => {
        result.current.handleCerrarNuevaCita();
      });
      expect(setModalNuevaCita).toHaveBeenCalledWith({ isOpen: false });
    });
  });

  describe('handleCrearCita', () => {
    it('creates single cita when not recurrent', async () => {
      const crearCita = createMockMutation({
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      });
      const { result } = setup({ crearCita });
      const response = await result.current.handleCrearCita({
        clienteNombre: 'Ana',
        clienteTelefono: '59170000000',
        fecha: '2026-01-15',
        horario: '10:00',
      });
      expect(crearCita.mutateAsync).toHaveBeenCalledWith({
        clienteNombre: 'Ana',
        clienteTelefono: '59170000000',
        fecha: '2026-01-15',
        horario: '10:00',
      });
      expect(response).toEqual({ success: true });
    });

    it('creates recurrent citas and returns error count', async () => {
      const crearCita = createMockMutation({
        mutateAsync: vi
          .fn()
          .mockResolvedValueOnce({ success: true })
          .mockResolvedValueOnce({ success: true })
          .mockResolvedValueOnce({ success: false }),
      });
      const { result } = setup({ crearCita });
      const response = await result.current.handleCrearCita({
        clienteNombre: 'Ana',
        clienteTelefono: '59170000000',
        fecha: '2026-01-05',
        horario: '10:00',
        esRecurrente: true,
        recurrence: 'weekly',
        recurrenceEnd: '2026-01-19',
      });
      expect(crearCita.mutateAsync).toHaveBeenCalledTimes(3);
      expect(response.success).toBe(false);
      expect(response.error).toContain('1');
    });
  });

  describe('handleCerrarReprogramar', () => {
    it('closes reprogramar modal', () => {
      const { result, setModalReprogramar } = setup({});
      act(() => {
        result.current.handleCerrarReprogramar();
      });
      expect(setModalReprogramar).toHaveBeenCalledWith({ isOpen: false });
    });
  });

  describe('handleReprogramarCita', () => {
    it('calls reprogramarCita and returns result', async () => {
      const reprogramarCita = createMockMutation({
        mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      });
      const { result } = setup({ reprogramarCita });
      const response = await result.current.handleReprogramarCita('1', '2026-01-20', '11:00');
      expect(reprogramarCita.mutateAsync).toHaveBeenCalledWith({
        citaId: '1',
        fecha: '2026-01-20',
        horario: '11:00',
      });
      expect(response).toEqual({ success: true });
    });
  });
});
