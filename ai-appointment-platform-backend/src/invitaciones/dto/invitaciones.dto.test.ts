import { describe, it, expect } from 'vitest';
import {
  InvitacionSchema,
  AceptarInvitacionSchema,
  ListarInvitacionesSchema,
} from './invitaciones.dto';

describe('invitaciones.dto', () => {
  describe('InvitacionSchema', () => {
    it('should accept a valid email with default rol', () => {
      const result = InvitacionSchema.parse({ email: 'staff@test.com' });
      expect(result.email).toBe('staff@test.com');
      expect(result.rol).toBeUndefined();
    });

    it('should accept ADMIN and STAFF roles', () => {
      expect(InvitacionSchema.parse({ email: 'a@test.com', rol: 'ADMIN' }).rol).toBe('ADMIN');
      expect(InvitacionSchema.parse({ email: 'b@test.com', rol: 'STAFF' }).rol).toBe('STAFF');
    });

    it('should reject an invalid email', () => {
      const result = InvitacionSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should reject an invalid rol', () => {
      const result = InvitacionSchema.safeParse({ email: 'a@test.com', rol: 'OWNER' });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      expect(InvitacionSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('AceptarInvitacionSchema', () => {
    it('should accept valid token, nombre and password', () => {
      const result = AceptarInvitacionSchema.parse({
        token: 'abc123',
        nombre: 'Ana',
        password: 'secret123',
      });
      expect(result.token).toBe('abc123');
      expect(result.nombre).toBe('Ana');
      expect(result.password).toBe('secret123');
    });

    it('should reject empty token', () => {
      expect(
        AceptarInvitacionSchema.safeParse({ token: '', nombre: 'Ana', password: 'secret123' })
          .success,
      ).toBe(false);
    });

    it('should reject a short nombre', () => {
      expect(
        AceptarInvitacionSchema.safeParse({ token: 't', nombre: 'A', password: 'secret123' })
          .success,
      ).toBe(false);
    });

    it('should reject a short password', () => {
      expect(
        AceptarInvitacionSchema.safeParse({ token: 't', nombre: 'Ana', password: '123' }).success,
      ).toBe(false);
    });
  });

  describe('ListarInvitacionesSchema', () => {
    it('should accept empty query', () => {
      expect(ListarInvitacionesSchema.parse({}).estado).toBeUndefined();
    });

    it('should accept a valid estado filter', () => {
      expect(ListarInvitacionesSchema.parse({ estado: 'PENDIENTE' }).estado).toBe('PENDIENTE');
      expect(ListarInvitacionesSchema.parse({ estado: 'ACEPTADA' }).estado).toBe('ACEPTADA');
      expect(ListarInvitacionesSchema.parse({ estado: 'CANCELADA' }).estado).toBe('CANCELADA');
      expect(ListarInvitacionesSchema.parse({ estado: 'EXPIRADA' }).estado).toBe('EXPIRADA');
    });

    it('should reject an invalid estado', () => {
      expect(ListarInvitacionesSchema.safeParse({ estado: 'OTRO' }).success).toBe(false);
    });
  });
});
