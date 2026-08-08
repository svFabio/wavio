import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from './usuarios.dto';

describe('usuarios.dto', () => {
  describe('createUserSchema', () => {
    it('should accept valid create user data', () => {
      const result = createUserSchema.parse({
        nombre: 'Staff User',
        email: 'staff@test.com',
        password: 'secret123',
        rol: 'STAFF',
      });
      expect(result.nombre).toBe('Staff User');
      expect(result.rol).toBe('STAFF');
    });

    it('should accept without optional rol', () => {
      const result = createUserSchema.parse({
        nombre: 'Staff User',
        email: 'staff@test.com',
        password: 'secret123',
      });
      expect(result.rol).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const result = createUserSchema.safeParse({
        nombre: 'User',
        email: 'bad-email',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = createUserSchema.safeParse({
        nombre: 'User',
        email: 'user@test.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty nombre', () => {
      const result = createUserSchema.safeParse({
        nombre: '',
        email: 'user@test.com',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid rol', () => {
      const result = createUserSchema.safeParse({
        nombre: 'User',
        email: 'user@test.com',
        password: 'secret123',
        rol: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should accept partial update', () => {
      const result = updateUserSchema.parse({ nombre: 'Updated' });
      expect(result.nombre).toBe('Updated');
    });

    it('should accept empty object (all optional)', () => {
      const result = updateUserSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid email', () => {
      const result = updateUserSchema.safeParse({ email: 'bad-email' });
      expect(result.success).toBe(false);
    });

    it('should accept password in update', () => {
      const result = updateUserSchema.parse({ password: 'nuevaclave123' });
      expect(result.password).toBe('nuevaclave123');
    });

    it('should accept empty password (no change)', () => {
      const result = updateUserSchema.parse({ password: '' });
      expect(result.password).toBe('');
    });

    it('should reject short password in update', () => {
      const result = updateUserSchema.safeParse({ password: '12345' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid rol', () => {
      const result = updateUserSchema.safeParse({ rol: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
