import { describe, it, expect } from 'vitest';
import {
  createServicioSchema,
  updateServicioSchema,
  updateHorariosSchema,
  createEspecialSchema,
} from './servicios.dto';

describe('servicios.dto', () => {
  describe('createServicioSchema', () => {
    it('should accept valid servicio data', () => {
      const result = createServicioSchema.parse({
        nombre: 'Corte de cabello',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
      });
      expect(result.nombre).toBe('Corte de cabello');
      expect(result.duracionMinutos).toBe(60);
    });

    it('should accept without optional fields', () => {
      const result = createServicioSchema.parse({ nombre: 'Corte' });
      expect(result.duracionMinutos).toBeUndefined();
    });

    it('should reject empty nombre', () => {
      const result = createServicioSchema.safeParse({ nombre: '' });
      expect(result.success).toBe(false);
    });

    it('should reject duracionMinutos too low', () => {
      const result = createServicioSchema.safeParse({ nombre: 'Corte', duracionMinutos: 10 });
      expect(result.success).toBe(false);
    });

    it('should reject duracionMinutos too high', () => {
      const result = createServicioSchema.safeParse({ nombre: 'Corte', duracionMinutos: 500 });
      expect(result.success).toBe(false);
    });

    it('should reject bufferMinutos out of range', () => {
      const result = createServicioSchema.safeParse({ nombre: 'Corte', bufferMinutos: 150 });
      expect(result.success).toBe(false);
    });

    it('should reject negative precio', () => {
      const result = createServicioSchema.safeParse({ nombre: 'Corte', precio: -10 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateServicioSchema', () => {
    it('should accept valid update', () => {
      const result = updateServicioSchema.parse({
        nombre: 'Updated',
        activo: false,
      });
      expect(result.nombre).toBe('Updated');
      expect(result.activo).toBe(false);
    });

    it('should accept empty object', () => {
      const result = updateServicioSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject duracionMinutos out of range', () => {
      const result = updateServicioSchema.safeParse({ duracionMinutos: 5 });
      expect(result.success).toBe(false);
    });

    it('should reject negative precio', () => {
      const result = updateServicioSchema.safeParse({ precio: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateHorariosSchema', () => {
    it('should accept valid horarios array', () => {
      const result = updateHorariosSchema.parse({
        horarios: [
          { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' },
          { diaSemana: 3, horaInicio: '10:00', horaFin: '16:00' },
        ],
      });
      expect(result.horarios).toHaveLength(2);
      expect(result.horarios[0].diaSemana).toBe(1);
    });

    it('should reject invalid horaInicio format', () => {
      const result = updateHorariosSchema.safeParse({
        horarios: [{ diaSemana: 1, horaInicio: '9:00', horaFin: '18:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject diaSemana out of range', () => {
      const result = updateHorariosSchema.safeParse({
        horarios: [{ diaSemana: 7, horaInicio: '09:00', horaFin: '18:00' }],
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty horarios array (schema allows empty)', () => {
      const result = updateHorariosSchema.safeParse({ horarios: [] });
      expect(result.success).toBe(true);
    });
  });

  describe('createEspecialSchema', () => {
    it('should accept valid especial schedule', () => {
      const result = createEspecialSchema.parse({
        fecha: '2025-12-25',
        cerrado: true,
        horaInicio: '10:00',
        horaFin: '14:00',
      });
      expect(result.fecha).toBe('2025-12-25');
      expect(result.cerrado).toBe(true);
    });

    it('should accept without optional time fields', () => {
      const result = createEspecialSchema.parse({
        fecha: '2025-12-25',
        cerrado: true,
      });
      expect(result.horaInicio).toBeUndefined();
    });

    it('should accept null time fields', () => {
      const result = createEspecialSchema.parse({
        fecha: '2025-12-25',
        cerrado: false,
        horaInicio: null,
        horaFin: null,
      });
      expect(result.horaInicio).toBeNull();
    });

    it('should reject empty fecha', () => {
      const result = createEspecialSchema.safeParse({
        fecha: '',
        cerrado: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject format mismatch', () => {
      const result = createEspecialSchema.safeParse({
        fecha: '2025-12-25',
        cerrado: false,
        horaInicio: '9:00',
        horaFin: '14:00',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing cerrado', () => {
      const result = createEspecialSchema.safeParse({
        fecha: '2025-12-25',
      });
      expect(result.success).toBe(false);
    });
  });
});
