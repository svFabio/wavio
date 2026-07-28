import { describe, it, expect } from 'vitest';
import { googleLoginSchema, emailAuthSchema, avatarSchema, nombreSchema } from './auth.dto';

describe('auth.dto', () => {
  describe('googleLoginSchema', () => {
    it('should accept valid input', () => {
      const result = googleLoginSchema.parse({ googleToken: 'token-abc' });
      expect(result.googleToken).toBe('token-abc');
      expect(result.userInfo).toBeUndefined();
    });

    it('should accept with userInfo', () => {
      const result = googleLoginSchema.parse({
        googleToken: 'token-abc',
        userInfo: { name: 'John' },
      });
      expect(result.userInfo).toEqual({ name: 'John' });
    });

    it('should accept empty googleToken (string is accepted)', () => {
      const result = googleLoginSchema.safeParse({ googleToken: '' });
      expect(result.success).toBe(true);
    });

    it('should reject missing googleToken', () => {
      const result = googleLoginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('emailAuthSchema', () => {
    it('should accept valid email and password', () => {
      const result = emailAuthSchema.parse({
        email: 'test@test.com',
        password: 'secret123',
      });
      expect(result.email).toBe('test@test.com');
      expect(result.password).toBe('secret123');
    });

    it('should reject invalid email', () => {
      const result = emailAuthSchema.safeParse({
        email: 'not-an-email',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = emailAuthSchema.safeParse({
        email: 'test@test.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = emailAuthSchema.safeParse({ email: 'test@test.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('avatarSchema', () => {
    it('should accept valid image string', () => {
      const result = avatarSchema.parse({ image: 'data:image/png;base64,...' });
      expect(result.image).toBe('data:image/png;base64,...');
    });

    it('should reject missing image', () => {
      const result = avatarSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('nombreSchema', () => {
    it('should accept valid nombre', () => {
      const result = nombreSchema.parse({ nombre: 'John' });
      expect(result.nombre).toBe('John');
    });

    it('should reject short nombre', () => {
      const result = nombreSchema.safeParse({ nombre: 'J' });
      expect(result.success).toBe(false);
    });

    it('should reject missing nombre', () => {
      const result = nombreSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
