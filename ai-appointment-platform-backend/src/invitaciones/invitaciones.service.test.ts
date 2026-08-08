import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { InvitacionesService } from './invitaciones.service';
import type { InvitacionesRepository } from './invitaciones.repository';
import { buildInvitacion, buildUsuario } from '../__tests__/factories';
import { ConflictError, ValidationError, NotFoundError, ForbiddenError } from '../domain/errors';

vi.hoisted(() => {
  process.env.LOG_LEVEL = 'fatal';
});

const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());

vi.mock('bcryptjs', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

const sha256 = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

// Token fijo determinista: 32 bytes de 0xaa → 64 caracteres 'a'
const FIXED_TOKEN = 'aa'.repeat(32);
const FIXED_TOKEN_HASH = sha256(FIXED_TOKEN);
const FALLBACK_URL = `http://localhost:3000/api/v1/invitaciones/aceptar/${FIXED_TOKEN}`;

describe('InvitacionesService', () => {
  let service: InvitacionesService;
  let mockRepo: Record<string, ReturnType<typeof vi.fn>>;
  let randomBytesSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findByTokenHash: vi.fn(),
      findPendingByEmailAndNegocio: vi.fn(),
      findMembershipByEmailAndNegocio: vi.fn(),
      voidExpiredByEmailAndNegocio: vi.fn(),
      findByIdAndNegocio: vi.fn(),
      findManyByNegocio: vi.fn(),
      updateEstado: vi.fn(),
      rotateToken: vi.fn(),
      findUsuarioByEmail: vi.fn(),
      findMembership: vi.fn(),
      acceptNewUser: vi.fn(),
      acceptExistingUser: vi.fn(),
    };

    service = new InvitacionesService(mockRepo as unknown as InvitacionesRepository);

    randomBytesSpy = vi.spyOn(crypto, 'randomBytes') as unknown as ReturnType<typeof vi.fn>;
    randomBytesSpy.mockReturnValue(Buffer.alloc(32, 0xaa));
    mockBcryptHash.mockReset().mockResolvedValue('hashed_password');
    mockBcryptCompare.mockReset();
  });

  afterEach(() => {
    randomBytesSpy.mockRestore();
    delete process.env.BACKEND_URL;
  });

  /* ─── createInvitacion ───────────────────────────────────────────── */

  describe('createInvitacion', () => {
    it('should create an invitacion and return the accept URL with the raw token', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(
        buildInvitacion(1, { id: 10, email: 'staff@test.com', rol: 'STAFF' }),
      );

      const result = await service.createInvitacion(1, { email: ' staff@test.com ' }, 'ADMIN', 2);

      expect(mockRepo.findMembershipByEmailAndNegocio).toHaveBeenCalledWith('staff@test.com', 1);
      expect(mockRepo.findPendingByEmailAndNegocio).toHaveBeenCalledWith('staff@test.com', 1);
      expect(mockRepo.voidExpiredByEmailAndNegocio).toHaveBeenCalledWith('staff@test.com', 1);
      expect(mockRepo.create).toHaveBeenCalledWith({
        negocioId: 1,
        email: 'staff@test.com',
        rol: 'STAFF',
        tokenHash: FIXED_TOKEN_HASH,
        expiraEn: expect.any(Date),
        creadoPor: 2,
      });
      expect(result.url).toBe(FALLBACK_URL);
      expect(result.email).toBe('staff@test.com');
      expect(result.rol).toBe('STAFF');
      expect(result.estado).toBe('PENDIENTE');
      expect(result.id).toBe(10);
    });

    it('should store a SHA-256 hash of the token, never the raw token', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(buildInvitacion(1));

      await service.createInvitacion(1, { email: 'staff@test.com' }, 'ADMIN', 2);

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.tokenHash).toBe(FIXED_TOKEN_HASH);
      expect(createCall.tokenHash).not.toContain(FIXED_TOKEN);
      // El token crudo solo aparece en la URL devuelta, nunca en la base
      expect(createCall.tokenHash).not.toBe(FIXED_TOKEN);
    });

    it('should build the URL from env.BACKEND_URL when set', async () => {
      vi.resetModules();
      process.env.BACKEND_URL = 'https://api.example.com';
      const { InvitacionesService: ReloadedService } = await import('./invitaciones.service');
      const reloadedService = new ReloadedService(mockRepo as unknown as InvitacionesRepository);

      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(buildInvitacion(1));

      const result = await reloadedService.createInvitacion(
        1,
        { email: 'staff@test.com' },
        'ADMIN',
        2,
      );

      expect(result.url).toBe(`https://api.example.com/api/v1/invitaciones/aceptar/${FIXED_TOKEN}`);
    });

    it('should throw ConflictError when the email already has an active membership', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue({ id: 7 });

      await expect(
        service.createInvitacion(1, { email: 'staff@test.com' }, 'ADMIN', 2),
      ).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when there is a PENDIENTE invitacion for the email', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(buildInvitacion(1));

      await expect(
        service.createInvitacion(1, { email: 'staff@test.com' }, 'ADMIN', 2),
      ).rejects.toThrow(ConflictError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when requestingRol is STAFF', async () => {
      await expect(
        service.createInvitacion(1, { email: 'staff@test.com' }, 'STAFF', 3),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when an ADMIN tries to invite an ADMIN', async () => {
      await expect(
        service.createInvitacion(1, { email: 'admin@test.com', rol: 'ADMIN' }, 'ADMIN', 2),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should allow an OWNER to invite an ADMIN', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(buildInvitacion(1, { rol: 'ADMIN' }));

      const result = await service.createInvitacion(
        1,
        { email: 'admin@test.com', rol: 'ADMIN' },
        'OWNER',
        1,
      );

      expect(result.rol).toBe('ADMIN');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'ADMIN', email: 'admin@test.com' }),
      );
    });

    it('should void expired invitaciones before checking pending and before creating a new one', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(buildInvitacion(1));

      await service.createInvitacion(1, { email: 'staff@test.com' }, 'ADMIN', 2);

      expect(mockRepo.voidExpiredByEmailAndNegocio.mock.invocationCallOrder[0]).toBeLessThan(
        mockRepo.findPendingByEmailAndNegocio.mock.invocationCallOrder[0],
      );
      expect(mockRepo.voidExpiredByEmailAndNegocio.mock.invocationCallOrder[0]).toBeLessThan(
        mockRepo.create.mock.invocationCallOrder[0],
      );
    });

    it('should re-invite an email whose previous PENDIENTE invitacion expired (void before conflict check)', async () => {
      mockRepo.findMembershipByEmailAndNegocio.mockResolvedValue(null);
      // El repositorio ya no devuelve invitaciones vencidas como pendientes
      // (filtra expiraEn >= now), así que ninguna bloquea el re-invite.
      mockRepo.findPendingByEmailAndNegocio.mockResolvedValue(null);
      mockRepo.voidExpiredByEmailAndNegocio.mockResolvedValue(undefined);
      mockRepo.create.mockResolvedValue(buildInvitacion(1, { id: 11, email: 'staff@test.com' }));

      const result = await service.createInvitacion(1, { email: 'staff@test.com' }, 'ADMIN', 2);

      expect(mockRepo.voidExpiredByEmailAndNegocio).toHaveBeenCalledWith('staff@test.com', 1);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result.id).toBe(11);
    });
  });

  /* ─── aceptarInvitacion ──────────────────────────────────────────── */

  describe('aceptarInvitacion', () => {
    it('should create a new usuario + membership and mark ACEPTADA', async () => {
      const invitacion = buildInvitacion(1, { email: 'staff@test.com', rol: 'STAFF' });
      mockRepo.findByTokenHash.mockResolvedValue(invitacion);
      mockRepo.findUsuarioByEmail.mockResolvedValue(null);
      mockRepo.acceptNewUser.mockResolvedValue({ usuarioId: 9 });

      const result = await service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123');

      expect(mockRepo.findByTokenHash).toHaveBeenCalledWith(FIXED_TOKEN_HASH);
      expect(mockRepo.acceptNewUser).toHaveBeenCalledWith({
        nombre: 'Ana',
        email: 'staff@test.com',
        password: 'hashed_password',
        rol: 'STAFF',
        negocioId: 1,
        invitacionId: invitacion.id,
        tokenHash: FIXED_TOKEN_HASH,
      });
      expect(mockBcryptHash).toHaveBeenCalledWith('secret123', 10);
      expect(result).toEqual({
        ok: true,
        usuario: { id: 9, nombre: 'Ana', email: 'staff@test.com', rol: 'STAFF' },
      });
    });

    it('should throw NotFoundError when the token hash does not match any invitacion', async () => {
      mockRepo.findByTokenHash.mockResolvedValue(null);

      await expect(service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ValidationError when the invitacion is expired', async () => {
      mockRepo.findByTokenHash.mockResolvedValue(
        buildInvitacion(1, { expiraEn: new Date('2025-01-01') }),
      );

      await expect(service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when the invitacion is not PENDIENTE', async () => {
      mockRepo.findByTokenHash.mockResolvedValue(buildInvitacion(1, { estado: 'ACEPTADA' }));

      await expect(service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ConflictError when the existing user already has a membership in the negocio (invite should never have been created)', async () => {
      const invitacion = buildInvitacion(1, { email: 'staff@test.com', rol: 'STAFF' });
      const existing = buildUsuario({ id: 5, email: 'staff@test.com', nombre: 'Staff Viejo' });
      mockRepo.findByTokenHash.mockResolvedValue(invitacion);
      mockRepo.findUsuarioByEmail.mockResolvedValue(existing);
      mockRepo.findMembership.mockResolvedValue({ usuarioId: 5, negocioId: 1, rol: 'ADMIN' });

      await expect(service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123')).rejects.toThrow(
        ConflictError,
      );
      expect(mockRepo.acceptExistingUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when the existing user already has a password (account takeover guard, password NOT changed)', async () => {
      const invitacion = buildInvitacion(1, { email: 'staff@test.com', rol: 'STAFF' });
      // buildUsuario por defecto trae password no vacía ('hashed_password').
      const existing = buildUsuario({ id: 5, email: 'staff@test.com', nombre: 'Staff Viejo' });
      mockRepo.findByTokenHash.mockResolvedValue(invitacion);
      mockRepo.findUsuarioByEmail.mockResolvedValue(existing);
      mockRepo.findMembership.mockResolvedValue(null);

      await expect(service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123')).rejects.toThrow(
        ConflictError,
      );
      // Nunca se reutiliza la cuenta ni se pide sobrescribir su password.
      expect(mockRepo.acceptExistingUser).not.toHaveBeenCalled();
    });

    it('should accept for an existing user with empty password: set password and create membership with the invite rol (no promotion)', async () => {
      const invitacion = buildInvitacion(1, { email: 'staff@test.com', rol: 'STAFF' });
      const existing = buildUsuario({
        id: 5,
        email: 'staff@test.com',
        nombre: 'Staff Viejo',
        password: '',
      });
      mockRepo.findByTokenHash.mockResolvedValue(invitacion);
      mockRepo.findUsuarioByEmail.mockResolvedValue(existing);
      mockRepo.findMembership.mockResolvedValue(null);
      mockRepo.acceptExistingUser.mockResolvedValue(undefined);

      const result = await service.aceptarInvitacion(FIXED_TOKEN, 'Ana', 'secret123');

      expect(mockRepo.acceptExistingUser).toHaveBeenCalledWith({
        usuarioId: 5,
        negocioId: 1,
        rol: 'STAFF',
        setPassword: true,
        password: 'hashed_password',
        invitacionId: invitacion.id,
        tokenHash: FIXED_TOKEN_HASH,
      });
      expect(result).toEqual({
        ok: true,
        usuario: { id: 5, nombre: 'Staff Viejo', email: 'staff@test.com', rol: 'STAFF' },
      });
    });
  });

  /* ─── listarInvitaciones ─────────────────────────────────────────── */

  describe('listarInvitaciones', () => {
    it('should list invitaciones of the negocio', async () => {
      mockRepo.findManyByNegocio.mockResolvedValue([
        buildInvitacion(1, { id: 1, email: 'a@test.com' }),
        buildInvitacion(1, { id: 2, email: 'b@test.com', estado: 'ACEPTADA' }),
      ]);

      const result = await service.listarInvitaciones(1);

      expect(mockRepo.findManyByNegocio).toHaveBeenCalledWith(1, undefined);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: expect.any(Number),
        email: 'a@test.com',
        rol: 'STAFF',
        estado: 'PENDIENTE',
        expiraEn: expect.any(Date),
        creadoEn: expect.any(Date),
      });
      expect(result[0]).not.toHaveProperty('url');
      expect(result[1].estado).toBe('ACEPTADA');
    });

    it('should forward the estado filter', async () => {
      mockRepo.findManyByNegocio.mockResolvedValue([]);

      await service.listarInvitaciones(1, 'PENDIENTE');

      expect(mockRepo.findManyByNegocio).toHaveBeenCalledWith(1, 'PENDIENTE');
    });

    it('should surface an expired PENDIENTE invitacion as EXPIRADA without writing to the DB', async () => {
      mockRepo.findManyByNegocio.mockResolvedValue([
        buildInvitacion(1, { id: 1, email: 'a@test.com', expiraEn: new Date('2025-01-01') }),
        buildInvitacion(1, { id: 2, email: 'b@test.com' }),
      ]);

      const result = await service.listarInvitaciones(1);

      expect(result[0].estado).toBe('EXPIRADA');
      expect(result[1].estado).toBe('PENDIENTE');
    });
  });

  /* ─── reenviarInvitacion ─────────────────────────────────────────── */

  describe('reenviarInvitacion', () => {
    it('should rotate the token and return a new URL', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(buildInvitacion(1, { id: 5 }));
      mockRepo.rotateToken.mockResolvedValue({ count: 1 });

      const result = await service.reenviarInvitacion(5, 1);

      expect(mockRepo.rotateToken).toHaveBeenCalledWith(5, FIXED_TOKEN_HASH, expect.any(Date));
      expect(result.url).toBe(FALLBACK_URL);
      // La nueva expiración es la que el servicio generó para la rotación.
      expect(result.expiraEn).toEqual(mockRepo.rotateToken.mock.calls[0][2]);
    });

    it('should throw NotFoundError when the invitacion does not belong to the negocio', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(null);

      await expect(service.reenviarInvitacion(5, 1)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when the invitacion is not PENDIENTE', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(
        buildInvitacion(1, { id: 5, estado: 'CANCELADA' }),
      );

      await expect(service.reenviarInvitacion(5, 1)).rejects.toThrow(ConflictError);
      expect(mockRepo.rotateToken).not.toHaveBeenCalled();
    });

    it('should mark an expired invitacion as EXPIRADA and throw ConflictError', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(
        buildInvitacion(1, { id: 5, expiraEn: new Date('2025-01-01') }),
      );
      mockRepo.updateEstado.mockResolvedValue({ id: 5, estado: 'EXPIRADA' });

      await expect(service.reenviarInvitacion(5, 1)).rejects.toThrow(ConflictError);

      expect(mockRepo.updateEstado).toHaveBeenCalledWith(5, 'EXPIRADA');
      expect(mockRepo.rotateToken).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when a race invalidated the invitacion before the rotation (count 0)', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(buildInvitacion(1, { id: 5 }));
      mockRepo.rotateToken.mockResolvedValue({ count: 0 });

      await expect(service.reenviarInvitacion(5, 1)).rejects.toThrow(ConflictError);
    });
  });

  /* ─── cancelarInvitacion ─────────────────────────────────────────── */

  describe('cancelarInvitacion', () => {
    it('should cancel a PENDIENTE invitacion', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(buildInvitacion(1, { id: 5 }));
      mockRepo.updateEstado.mockResolvedValue({ id: 5, estado: 'CANCELADA' });

      const result = await service.cancelarInvitacion(5, 1);

      expect(mockRepo.updateEstado).toHaveBeenCalledWith(5, 'CANCELADA');
      expect(result).toEqual({ id: 5, estado: 'CANCELADA' });
    });

    it('should be idempotent for an already CANCELADA invitacion', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(
        buildInvitacion(1, { id: 5, estado: 'CANCELADA' }),
      );

      const result = await service.cancelarInvitacion(5, 1);

      expect(mockRepo.updateEstado).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 5, estado: 'CANCELADA' });
    });

    it('should throw ConflictError when the invitacion was already accepted', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(
        buildInvitacion(1, { id: 5, estado: 'ACEPTADA' }),
      );

      await expect(service.cancelarInvitacion(5, 1)).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when a concurrent accept wins the race (atomic guard)', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(buildInvitacion(1, { id: 5 }));
      mockRepo.updateEstado.mockResolvedValue({ id: 5, estado: 'ACEPTADA' });

      await expect(service.cancelarInvitacion(5, 1)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when the invitacion does not belong to the negocio', async () => {
      mockRepo.findByIdAndNegocio.mockResolvedValue(null);

      await expect(service.cancelarInvitacion(5, 1)).rejects.toThrow(NotFoundError);
    });
  });
});
