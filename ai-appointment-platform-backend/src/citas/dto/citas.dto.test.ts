import { describe, it, expect } from 'vitest';
import {
  validarCitaSchema,
  crearCitaAdminSchema,
  crearCitaRecurrenteSchema,
  reprogramarCitaSchema,
  actualizarDescripcionSchema,
  agendaQuerySchema,
  horariosQuerySchema,
  serieIdQuerySchema,
} from './citas.dto';

describe('citas.dto', () => {
  describe('validarCitaSchema', () => {
    it('should accept valid acciones', () => {
      for (const accion of ['CONFIRMAR', 'APROBAR', 'CANCELAR', 'RECHAZAR']) {
        const result = validarCitaSchema.parse({ accion });
        expect(result.accion).toBe(accion);
      }
    });

    it('should reject invalid accion', () => {
      const result = validarCitaSchema.safeParse({ accion: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject missing accion', () => {
      const result = validarCitaSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('crearCitaAdminSchema', () => {
    it('should accept valid cita data', () => {
      const result = crearCitaAdminSchema.parse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        monto: 250,
        servicioId: 1,
        staffId: 2,
        duracionMinutos: 60,
      });
      expect(result.clienteNombre).toBe('Juan Pérez');
      expect(result.fecha).toBe('2025-06-15');
      expect(result.monto).toBe(250);
      expect(result.duracionMinutos).toBe(60);
    });

    it('should accept without optional fields', () => {
      const result = crearCitaAdminSchema.parse({
        clienteNombre: 'Juan',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
      });
      expect(result.monto).toBeUndefined();
      expect(result.servicioId).toBeUndefined();
    });

    it('should reject short clienteNombre', () => {
      const result = crearCitaAdminSchema.safeParse({
        clienteNombre: 'Jo',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short clienteTelefono', () => {
      const result = crearCitaAdminSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '123',
        fecha: '2025-06-15',
        horario: '10:00',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid fecha format', () => {
      const result = crearCitaAdminSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '15-06-2025',
        horario: '10:00',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative monto', () => {
      const result = crearCitaAdminSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        monto: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject duracionMinutos out of range', () => {
      const result = crearCitaAdminSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        duracionMinutos: 500,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('crearCitaRecurrenteSchema', () => {
    it('should accept valid recurring cita data', () => {
      const result = crearCitaRecurrenteSchema.parse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        recurrence: 'weekly',
        recurrenceEnd: '2025-09-15',
      });
      expect(result.clienteNombre).toBe('Juan Pérez');
      expect(result.recurrence).toBe('weekly');
      expect(result.recurrenceEnd).toBe('2025-09-15');
    });

    it('should reject invalid recurrence', () => {
      const result = crearCitaRecurrenteSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        recurrence: 'daily',
        recurrenceEnd: '2025-09-15',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid recurrenceEnd format', () => {
      const result = crearCitaRecurrenteSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        recurrence: 'biweekly',
        recurrenceEnd: '15-09-2025',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing recurrence', () => {
      const result = crearCitaRecurrenteSchema.safeParse({
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '12345678',
        fecha: '2025-06-15',
        horario: '10:00',
        recurrenceEnd: '2025-09-15',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reprogramarCitaSchema', () => {
    it('should accept valid reprogram data', () => {
      const result = reprogramarCitaSchema.parse({
        fecha: '2025-06-20',
        horario: '11:00',
      });
      expect(result.fecha).toBe('2025-06-20');
      expect(result.horario).toBe('11:00');
    });

    it('should reject missing fecha', () => {
      const result = reprogramarCitaSchema.safeParse({ horario: '11:00' });
      expect(result.success).toBe(false);
    });

    it('should reject missing horario', () => {
      const result = reprogramarCitaSchema.safeParse({ fecha: '2025-06-20' });
      expect(result.success).toBe(false);
    });
  });

  describe('actualizarDescripcionSchema', () => {
    it('should accept valid descripcion', () => {
      const result = actualizarDescripcionSchema.parse({
        descripcion: 'Cliente llegó tarde',
      });
      expect(result.descripcion).toBe('Cliente llegó tarde');
    });

    it('should accept empty object', () => {
      const result = actualizarDescripcionSchema.parse({});
      expect(result.descripcion).toBeUndefined();
    });
  });

  describe('agendaQuerySchema', () => {
    it('should accept valid fecha', () => {
      const result = agendaQuerySchema.parse({ fecha: '2025-06-15' });
      expect(result.fecha).toBe('2025-06-15');
      expect(result.desde).toBeUndefined();
    });

    it('should accept desde and hasta', () => {
      const result = agendaQuerySchema.parse({
        desde: '2025-06-01T00:00:00.000Z',
        hasta: '2025-06-30T00:00:00.000Z',
      });
      expect(result.desde).toBe('2025-06-01T00:00:00.000Z');
    });

    it('should accept empty object', () => {
      const result = agendaQuerySchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid fecha format', () => {
      const result = agendaQuerySchema.safeParse({ fecha: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime', () => {
      const result = agendaQuerySchema.safeParse({ desde: 'not-a-datetime' });
      expect(result.success).toBe(false);
    });
  });

  describe('horariosQuerySchema', () => {
    it('should accept valid query', () => {
      const result = horariosQuerySchema.parse({
        fecha: '2025-06-15',
        servicioId: '1',
        staffId: '2',
      });
      expect(result.fecha).toBe('2025-06-15');
      expect(result.servicioId).toBe(1);
      expect(result.staffId).toBe(2);
    });

    it('should accept without optional fields', () => {
      const result = horariosQuerySchema.parse({ fecha: '2025-06-15' });
      expect(result.servicioId).toBeUndefined();
    });

    it('should reject missing fecha', () => {
      const result = horariosQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('serieIdQuerySchema', () => {
    it('should accept valid serieId', () => {
      const result = serieIdQuerySchema.parse({ serieId: 'rec-123' });
      expect(result.serieId).toBe('rec-123');
    });

    it('should reject missing serieId', () => {
      const result = serieIdQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty serieId', () => {
      const result = serieIdQuerySchema.safeParse({ serieId: '' });
      expect(result.success).toBe(false);
    });
  });
});
