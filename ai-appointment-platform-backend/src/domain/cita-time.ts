/**
 * Domain helper for appointment datetime composition.
 *
 * Citas store `fecha` (day) and `horario` (HH:MM) separately. This helper
 * composes the exact appointment datetime, keeping the parsing logic in the
 * domain layer so repositories stay pure data access.
 */

import { ValidationError } from './errors';

export interface CitaConHorario {
  fecha: Date;
  horario: string;
}

export function buildCitaDateTime(fecha: Date, horario: string): Date {
  const [horas, minutos] = horario.split(':').map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    throw new ValidationError(`Invalid horario format: ${horario}`);
  }
  const dateTime = new Date(fecha);
  dateTime.setHours(horas, minutos, 0, 0);
  return dateTime;
}

export function isWithinReminderWindow(cita: CitaConHorario, desde: Date, hasta: Date): boolean {
  const dateTime = buildCitaDateTime(cita.fecha, cita.horario);
  return dateTime >= desde && dateTime <= hasta;
}

export function isBeforeSurveyCutoff(cita: CitaConHorario, cutoff: Date): boolean {
  const dateTime = buildCitaDateTime(cita.fecha, cita.horario);
  return dateTime < cutoff;
}
