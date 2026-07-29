import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHorariosTabState } from '../useHorariosTabState';
import type { HorarioNegocio } from '../../types';

describe('useHorariosTabState', () => {
  it('initializes localHorarios with default ranges when horarios is empty', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    const keys = Object.keys(result.current.localHorarios);
    expect(keys).toHaveLength(7);
    Object.values(result.current.localHorarios).forEach((rangos) => {
      expect(rangos).toHaveLength(1);
      expect(rangos[0].activo).toBe(false);
      expect(rangos[0].horaInicio).toBe('09:00');
      expect(rangos[0].horaFin).toBe('13:00');
    });
  });

  it('maps existing horarios correctly', () => {
    const horarios: HorarioNegocio[] = [
      { id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', activo: true },
      { id: 2, diaSemana: 1, horaInicio: '14:00', horaFin: '18:00', activo: true },
    ];
    const { result } = renderHook(() => useHorariosTabState(horarios));
    expect(result.current.localHorarios[1]).toHaveLength(2);
    expect(result.current.localHorarios[1][0].horaInicio).toBe('09:00');
    expect(result.current.localHorarios[1][1].horaInicio).toBe('14:00');
  });

  it('handleToggle toggles all ranges for a day', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    expect(result.current.localHorarios[1][0].activo).toBe(false);
    act(() => result.current.handleToggle(1));
    expect(result.current.localHorarios[1][0].activo).toBe(true);
    act(() => result.current.handleToggle(1));
    expect(result.current.localHorarios[1][0].activo).toBe(false);
  });

  it('handleChange updates a specific field', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    act(() => result.current.handleChange(1, 0, 'horaInicio', '10:00'));
    expect(result.current.localHorarios[1][0].horaInicio).toBe('10:00');
  });

  it('handleAddRange adds a new range', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    expect(result.current.localHorarios[1]).toHaveLength(1);
    act(() => result.current.handleAddRange(1));
    expect(result.current.localHorarios[1]).toHaveLength(2);
    expect(result.current.localHorarios[1][1].horaInicio).toBe('14:00');
    expect(result.current.localHorarios[1][1].horaFin).toBe('18:00');
  });

  it('handleRemoveRange removes a range when more than one exists', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    act(() => result.current.handleAddRange(1));
    expect(result.current.localHorarios[1]).toHaveLength(2);
    act(() => result.current.handleRemoveRange(1, 1));
    expect(result.current.localHorarios[1]).toHaveLength(1);
  });

  it('handleRemoveRange does not remove the last range', () => {
    const { result } = renderHook(() => useHorariosTabState([]));
    act(() => result.current.handleRemoveRange(1, 0));
    expect(result.current.localHorarios[1]).toHaveLength(1);
  });

  it('buildPayload returns only active ranges', () => {
    const horarios: HorarioNegocio[] = [
      { id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', activo: true },
      { id: 2, diaSemana: 2, horaInicio: '09:00', horaFin: '18:00', activo: true },
    ];
    const { result } = renderHook(() => useHorariosTabState(horarios));
    const payload = result.current.buildPayload();
    expect(payload).toHaveLength(2);
    expect(payload[0]).toEqual({ diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' });
    expect(payload[1]).toEqual({ diaSemana: 2, horaInicio: '09:00', horaFin: '18:00' });
  });

  it('buildPayload excludes inactive ranges', () => {
    const horarios: HorarioNegocio[] = [
      { id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', activo: true },
      { id: 2, diaSemana: 1, horaInicio: '14:00', horaFin: '18:00', activo: false },
    ];
    const { result } = renderHook(() => useHorariosTabState(horarios));
    const payload = result.current.buildPayload();
    expect(payload).toHaveLength(1);
    expect(payload[0].diaSemana).toBe(1);
  });
});
