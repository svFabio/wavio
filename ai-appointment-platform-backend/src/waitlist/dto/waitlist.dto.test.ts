import { describe, it, expect } from 'vitest';
import { addToWaitlistSchema } from './waitlist.dto';

describe('waitlist.dto', () => {
  describe('addToWaitlistSchema', () => {
    it('should accept valid waitlist entry', () => {
      const result = addToWaitlistSchema.parse({
        clienteNombre: 'María García',
        clienteTelefono: '+529876543210',
        servicioId: 1,
        fechaPreferida: '2025-02-01T00:00:00.000Z',
        horarioPreferido: '14:00',
      });
      expect(result.clienteNombre).toBe('María García');
      expect(result.clienteTelefono).toBe('+529876543210');
      expect(result.servicioId).toBe(1);
      expect(result.fechaPreferida).toBeInstanceOf(Date);
      expect(result.horarioPreferido).toBe('14:00');
    });

    it('should accept minimal input without optional fields', () => {
      const result = addToWaitlistSchema.parse({
        clienteNombre: 'María',
        clienteTelefono: '+529876543210',
        fechaPreferida: '2025-02-01T00:00:00.000Z',
      });
      expect(result.servicioId).toBeUndefined();
      expect(result.horarioPreferido).toBeUndefined();
    });

    it('should transform string fecha to Date', () => {
      const result = addToWaitlistSchema.parse({
        clienteNombre: 'María',
        clienteTelefono: '+529876543210',
        fechaPreferida: '2025-06-15T10:00:00.000Z',
      });
      expect(result.fechaPreferida).toBeInstanceOf(Date);
      expect(result.fechaPreferida.toISOString()).toBe('2025-06-15T10:00:00.000Z');
    });

    it('should reject empty clienteNombre', () => {
      const result = addToWaitlistSchema.safeParse({
        clienteNombre: '',
        clienteTelefono: '+529876543210',
        fechaPreferida: '2025-02-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty clienteTelefono', () => {
      const result = addToWaitlistSchema.safeParse({
        clienteNombre: 'María',
        clienteTelefono: '',
        fechaPreferida: '2025-02-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive servicioId', () => {
      const result = addToWaitlistSchema.safeParse({
        clienteNombre: 'María',
        clienteTelefono: '+529876543210',
        servicioId: -1,
        fechaPreferida: '2025-02-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fechaPreferida', () => {
      const result = addToWaitlistSchema.safeParse({
        clienteNombre: 'María',
        clienteTelefono: '+529876543210',
      });
      expect(result.success).toBe(false);
    });
  });
});
