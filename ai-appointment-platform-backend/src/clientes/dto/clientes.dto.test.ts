import { describe, it, expect } from 'vitest';
import { createClienteSchema, updateClienteSchema } from './clientes.dto';

describe('clientes.dto', () => {
  describe('createClienteSchema', () => {
    it('should accept valid cliente data', () => {
      const result = createClienteSchema.parse({
        nombre: 'Juan Pérez',
        telefono: '+521234567890',
        email: 'juan@test.com',
        notas: 'Cliente frecuente',
      });
      expect(result.nombre).toBe('Juan Pérez');
      expect(result.telefono).toBe('+521234567890');
      expect(result.email).toBe('juan@test.com');
      expect(result.notas).toBe('Cliente frecuente');
    });

    it('should accept without optional fields', () => {
      const result = createClienteSchema.parse({
        nombre: 'Juan',
        telefono: '+521234567890',
      });
      expect(result.email).toBeUndefined();
      expect(result.notas).toBeUndefined();
    });

    it('should reject empty nombre', () => {
      const result = createClienteSchema.safeParse({
        nombre: '',
        telefono: '+521234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty telefono', () => {
      const result = createClienteSchema.safeParse({
        nombre: 'Juan',
        telefono: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createClienteSchema.safeParse({
        nombre: 'Juan',
        telefono: '+521234567890',
        email: 'bad-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing nombre', () => {
      const result = createClienteSchema.safeParse({ telefono: '+521234567890' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateClienteSchema', () => {
    it('should accept partial update', () => {
      const result = updateClienteSchema.parse({ nombre: 'Updated' });
      expect(result.nombre).toBe('Updated');
    });

    it('should accept empty object', () => {
      const result = updateClienteSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid email', () => {
      const result = updateClienteSchema.safeParse({ email: 'bad-email' });
      expect(result.success).toBe(false);
    });
  });
});
