import { describe, it, expect } from 'vitest';
import {
  ConfiguracionUpdateSchema,
  QrUploadSchema,
  NegocioConfiguracionSchema,
} from './negocio.dto';

describe('negocio.dto', () => {
  describe('ConfiguracionUpdateSchema', () => {
    it('should accept valid config update', () => {
      const result = ConfiguracionUpdateSchema.parse({
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
      const result = ConfiguracionUpdateSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject porcentajeAdelanto out of range', () => {
      const result = ConfiguracionUpdateSchema.safeParse({ porcentajeAdelanto: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject porcentajeAdelanto above 100', () => {
      const result = ConfiguracionUpdateSchema.safeParse({ porcentajeAdelanto: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept qrFotoUrl as null', () => {
      const result = ConfiguracionUpdateSchema.parse({ qrFotoUrl: null });
      expect(result.qrFotoUrl).toBeNull();
    });
  });

  describe('QrUploadSchema', () => {
    it('should accept valid image string', () => {
      const result = QrUploadSchema.parse({ imagen: 'data:image/png;base64,...' });
      expect(result.imagen).toBe('data:image/png;base64,...');
    });

    it('should reject empty string', () => {
      const result = QrUploadSchema.safeParse({ imagen: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing imagen', () => {
      const result = QrUploadSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('NegocioConfiguracionSchema', () => {
    it('should accept valid nombre', () => {
      const result = NegocioConfiguracionSchema.parse({ nombre: 'Mi Spa' });
      expect(result.nombre).toBe('Mi Spa');
    });

    it('should reject empty nombre', () => {
      const result = NegocioConfiguracionSchema.safeParse({ nombre: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing nombre', () => {
      const result = NegocioConfiguracionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
