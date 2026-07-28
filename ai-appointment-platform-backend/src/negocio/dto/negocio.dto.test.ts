import { describe, it, expect } from 'vitest';
import { updateConfiguracionSchema, uploadQrSchema, configurarNegocioSchema } from './negocio.dto';

describe('negocio.dto', () => {
  describe('updateConfiguracionSchema', () => {
    it('should accept valid config update', () => {
      const result = updateConfiguracionSchema.parse({
        trigger: '!cita',
        mensajeBienvenida: 'Hola!',
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        timezone: 'America/La_Paz',
      });
      expect(result.trigger).toBe('!cita');
      expect(result.porcentajeAdelanto).toBe(50);
    });

    it('should accept empty object', () => {
      const result = updateConfiguracionSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject porcentajeAdelanto out of range', () => {
      const result = updateConfiguracionSchema.safeParse({ porcentajeAdelanto: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject porcentajeAdelanto above 100', () => {
      const result = updateConfiguracionSchema.safeParse({ porcentajeAdelanto: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept qrFotoUrl as null', () => {
      const result = updateConfiguracionSchema.parse({ qrFotoUrl: null });
      expect(result.qrFotoUrl).toBeNull();
    });
  });

  describe('uploadQrSchema', () => {
    it('should accept valid image string', () => {
      const result = uploadQrSchema.parse({ imagen: 'data:image/png;base64,...' });
      expect(result.imagen).toBe('data:image/png;base64,...');
    });

    it('should reject empty string', () => {
      const result = uploadQrSchema.safeParse({ imagen: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing imagen', () => {
      const result = uploadQrSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('configurarNegocioSchema', () => {
    it('should accept valid nombre', () => {
      const result = configurarNegocioSchema.parse({ nombre: 'Mi Spa' });
      expect(result.nombre).toBe('Mi Spa');
    });

    it('should reject empty nombre', () => {
      const result = configurarNegocioSchema.safeParse({ nombre: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing nombre', () => {
      const result = configurarNegocioSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
