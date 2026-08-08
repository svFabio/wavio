import { describe, it, expect } from 'vitest';
import { buildCitaDateTime, isWithinReminderWindow, isBeforeSurveyCutoff } from './cita-time';

// Use local date constructors so assertions are TZ-independent.
const fecha = new Date(2026, 6, 28); // 2026-07-28 00:00 local

describe('cita-time domain helpers', () => {
  describe('buildCitaDateTime', () => {
    it('composes fecha + horario into an exact datetime', () => {
      const result = buildCitaDateTime(fecha, '09:30');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(28);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
    });

    it('throws ValidationError on malformed horario', () => {
      try {
        buildCitaDateTime(fecha, 'not-a-time');
        expect.unreachable('should have thrown');
      } catch (error) {
        expect((error as Error).message).toMatch(/Invalid horario format/);
        expect((error as { code?: string }).code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('isWithinReminderWindow', () => {
    const desde = new Date(2026, 6, 28, 10, 0);
    const hasta = new Date(2026, 6, 28, 12, 0);

    it('returns true when cita is inside the window', () => {
      expect(isWithinReminderWindow({ fecha, horario: '11:00' }, desde, hasta)).toBe(true);
    });

    it('returns false when cita is before the window', () => {
      expect(isWithinReminderWindow({ fecha, horario: '09:00' }, desde, hasta)).toBe(false);
    });

    it('returns false when cita is after the window', () => {
      expect(isWithinReminderWindow({ fecha, horario: '13:00' }, desde, hasta)).toBe(false);
    });
  });

  describe('isBeforeSurveyCutoff', () => {
    const cutoff = new Date(2026, 6, 28, 12, 0);

    it('returns true when cita is before cutoff', () => {
      expect(isBeforeSurveyCutoff({ fecha, horario: '10:00' }, cutoff)).toBe(true);
    });

    it('returns false when cita is at or after cutoff', () => {
      expect(isBeforeSurveyCutoff({ fecha, horario: '12:00' }, cutoff)).toBe(false);
    });
  });
});
