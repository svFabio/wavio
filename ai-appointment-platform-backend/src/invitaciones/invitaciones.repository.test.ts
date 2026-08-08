import { describe, it, expect, beforeEach } from 'vitest';
import { InvitacionesRepository } from './invitaciones.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildInvitacion, buildUsuario } from '../__tests__/factories';
import { ConflictError, NotFoundError } from '../domain/errors';

describe('InvitacionesRepository', () => {
  let prisma: MockPrisma;
  let repo: InvitacionesRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') return arg(prisma);
      return arg;
    });
    repo = new InvitacionesRepository(prisma as never);
  });

  describe('create', () => {
    it('should create an invitacion with the given data', async () => {
      const invitacion = buildInvitacion(1, { email: 'staff@test.com' });
      prisma.invitacion.create.mockResolvedValue(invitacion);

      const result = await repo.create({
        negocioId: 1,
        email: 'staff@test.com',
        rol: 'STAFF',
        tokenHash: 'hash',
        expiraEn: new Date('2026-08-10'),
        creadoPor: 1,
      });

      expect(prisma.invitacion.create).toHaveBeenCalledWith({
        data: {
          negocioId: 1,
          email: 'staff@test.com',
          rol: 'STAFF',
          tokenHash: 'hash',
          expiraEn: new Date('2026-08-10'),
          creadoPor: 1,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(invitacion);
    });
  });

  describe('findByTokenHash', () => {
    it('should find an invitacion by tokenHash', async () => {
      const invitacion = buildInvitacion(1);
      prisma.invitacion.findUnique.mockResolvedValue(invitacion);

      const result = await repo.findByTokenHash('hash');

      expect(prisma.invitacion.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: 'hash' },
        select: expect.any(Object),
      });
      expect(result).toEqual(invitacion);
    });

    it('should return null when not found', async () => {
      prisma.invitacion.findUnique.mockResolvedValue(null);

      const result = await repo.findByTokenHash('missing');

      expect(result).toBeNull();
    });
  });

  describe('findPendingByEmailAndNegocio', () => {
    it('should find a PENDIENTE and unexpired invitacion for email+negocio', async () => {
      const invitacion = buildInvitacion(1, { email: 's@test.com' });
      prisma.invitacion.findFirst.mockResolvedValue(invitacion);

      const result = await repo.findPendingByEmailAndNegocio('s@test.com', 1);

      expect(prisma.invitacion.findFirst).toHaveBeenCalledWith({
        where: {
          email: 's@test.com',
          negocioId: 1,
          estado: 'PENDIENTE',
          expiraEn: { gte: expect.any(Date) },
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(invitacion);
    });
  });

  describe('voidExpiredByEmailAndNegocio', () => {
    it('should mark expired PENDIENTE invitaciones as EXPIRADA', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });

      await repo.voidExpiredByEmailAndNegocio('s@test.com', 1);

      expect(prisma.invitacion.updateMany).toHaveBeenCalledWith({
        where: {
          email: 's@test.com',
          negocioId: 1,
          estado: 'PENDIENTE',
          expiraEn: { lt: expect.any(Date) },
        },
        data: { estado: 'EXPIRADA' },
      });
    });
  });

  describe('findMembershipByEmailAndNegocio', () => {
    it('should return the usuario when it has a membership in the negocio', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 7 });

      const result = await repo.findMembershipByEmailAndNegocio('s@test.com', 1);

      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { email: 's@test.com', usuarioNegocios: { some: { negocioId: 1 } } },
        select: { id: true },
      });
      expect(result).toEqual({ id: 7 });
    });
  });

  describe('findByIdAndNegocio', () => {
    it('should find an invitacion scoped to the negocio', async () => {
      const invitacion = buildInvitacion(1, { id: 5 });
      prisma.invitacion.findFirst.mockResolvedValue(invitacion);

      const result = await repo.findByIdAndNegocio(5, 1);

      expect(prisma.invitacion.findFirst).toHaveBeenCalledWith({
        where: { id: 5, negocioId: 1 },
        select: expect.any(Object),
      });
      expect(result).toEqual(invitacion);
    });
  });

  describe('findManyByNegocio', () => {
    it('should list all invitaciones of the negocio without estado filter', async () => {
      prisma.invitacion.findMany.mockResolvedValue([buildInvitacion(1)]);

      const result = await repo.findManyByNegocio(1);

      expect(prisma.invitacion.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        select: expect.any(Object),
        orderBy: { creadoEn: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by estado when provided', async () => {
      prisma.invitacion.findMany.mockResolvedValue([buildInvitacion(1, { estado: 'PENDIENTE' })]);

      const result = await repo.findManyByNegocio(1, 'PENDIENTE');

      expect(prisma.invitacion.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'PENDIENTE' },
        select: expect.any(Object),
        orderBy: { creadoEn: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateEstado', () => {
    it('should conditionally update a PENDIENTE invitacion and return the new estado', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.updateEstado(5, 'CANCELADA');

      expect(prisma.invitacion.updateMany).toHaveBeenCalledWith({
        where: { id: 5, estado: 'PENDIENTE' },
        data: { estado: 'CANCELADA' },
      });
      expect(prisma.invitacion.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 5, estado: 'CANCELADA' });
    });

    it('should return the current estado when a race changed the row (count 0)', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 0 });
      prisma.invitacion.findUnique.mockResolvedValue({ id: 5, estado: 'ACEPTADA' });

      const result = await repo.updateEstado(5, 'CANCELADA');

      expect(prisma.invitacion.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
        select: { id: true, estado: true },
      });
      expect(result).toEqual({ id: 5, estado: 'ACEPTADA' });
    });

    it('should throw NotFoundError when the row no longer exists', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 0 });
      prisma.invitacion.findUnique.mockResolvedValue(null);

      await expect(repo.updateEstado(5, 'CANCELADA')).rejects.toThrow(NotFoundError);
    });
  });

  describe('rotateToken', () => {
    it('should conditionally rotate tokenHash and expiraEn only for a PENDIENTE, unexpired invitacion', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });

      const result = await repo.rotateToken(5, 'new-hash', new Date('2026-08-11'));

      expect(prisma.invitacion.updateMany).toHaveBeenCalledWith({
        where: { id: 5, estado: 'PENDIENTE', expiraEn: { gt: expect.any(Date) } },
        data: { tokenHash: 'new-hash', expiraEn: new Date('2026-08-11') },
      });
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('findUsuarioByEmail', () => {
    it('should return the usuario with password', async () => {
      const usuario = { ...buildUsuario({ email: 's@test.com' }), password: 'hashed' };
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await repo.findUsuarioByEmail('s@test.com');

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 's@test.com' },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });
  });

  describe('findMembership', () => {
    it('should return the membership', async () => {
      prisma.usuarioNegocio.findUnique.mockResolvedValue({
        usuarioId: 3,
        negocioId: 1,
        rol: 'STAFF',
      });

      const result = await repo.findMembership(3, 1);

      expect(prisma.usuarioNegocio.findUnique).toHaveBeenCalledWith({
        where: { usuarioId_negocioId: { usuarioId: 3, negocioId: 1 } },
      });
      expect(result?.rol).toBe('STAFF');
    });
  });

  describe('acceptNewUser', () => {
    it('should conditionally mark ACEPTADA first, then create usuario and membership in one transaction', async () => {
      const usuario = buildUsuario({ id: 9, email: 's@test.com' });
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });
      prisma.usuario.create.mockResolvedValue(usuario);
      prisma.usuarioNegocio.create.mockResolvedValue({} as never);

      const result = await repo.acceptNewUser({
        nombre: 'Ana',
        email: 's@test.com',
        password: 'hashed',
        rol: 'STAFF',
        negocioId: 1,
        invitacionId: 5,
        tokenHash: 'hash',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.invitacion.updateMany).toHaveBeenCalledWith({
        where: {
          id: 5,
          tokenHash: 'hash',
          estado: 'PENDIENTE',
          expiraEn: { gt: expect.any(Date) },
        },
        data: { estado: 'ACEPTADA', aceptadaEn: expect.any(Date) },
      });
      // La marca ACEPTADA condicional ocurre ANTES de crear el usuario: un
      // segundo accept del mismo token falla en count === 0 y nunca llega a
      // crear el usuario (evita el P2002 → 500 por email duplicado).
      expect(prisma.invitacion.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        prisma.usuario.create.mock.invocationCallOrder[0],
      );
      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: { nombre: 'Ana', email: 's@test.com', password: 'hashed', rol: 'STAFF' },
      });
      expect(prisma.usuarioNegocio.create).toHaveBeenCalledWith({
        data: { usuarioId: 9, negocioId: 1, rol: 'STAFF' },
      });
      expect(result).toEqual({ usuarioId: 9 });
    });

    it('should roll back with ConflictError and not create the usuario when the invitacion is no longer valid (count 0)', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repo.acceptNewUser({
          nombre: 'Ana',
          email: 's@test.com',
          password: 'hashed',
          rol: 'STAFF',
          negocioId: 1,
          invitacionId: 5,
          tokenHash: 'hash',
        }),
      ).rejects.toThrow(ConflictError);
      expect(prisma.usuario.create).not.toHaveBeenCalled();
      expect(prisma.usuarioNegocio.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptExistingUser', () => {
    it('should conditionally mark ACEPTADA, set password and upsert membership in one transaction', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });
      prisma.usuario.update.mockResolvedValue({} as never);
      prisma.usuarioNegocio.upsert.mockResolvedValue({} as never);

      await repo.acceptExistingUser({
        usuarioId: 3,
        negocioId: 1,
        rol: 'STAFF',
        invitacionId: 5,
        tokenHash: 'hash',
        setPassword: true,
        password: 'hashed',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.invitacion.updateMany).toHaveBeenCalledWith({
        where: {
          id: 5,
          tokenHash: 'hash',
          estado: 'PENDIENTE',
          expiraEn: { gt: expect.any(Date) },
        },
        data: { estado: 'ACEPTADA', aceptadaEn: expect.any(Date) },
      });
      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { password: 'hashed' },
      });
      expect(prisma.usuarioNegocio.upsert).toHaveBeenCalledWith({
        where: { usuarioId_negocioId: { usuarioId: 3, negocioId: 1 } },
        update: {},
        create: { usuarioId: 3, negocioId: 1, rol: 'STAFF' },
      });
    });

    it('should NOT update the password when setPassword is false (never overwrite credentials)', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 1 });
      prisma.usuarioNegocio.upsert.mockResolvedValue({} as never);

      await repo.acceptExistingUser({
        usuarioId: 3,
        negocioId: 1,
        rol: 'STAFF',
        invitacionId: 5,
        tokenHash: 'hash',
        setPassword: false,
        password: 'hashed',
      });

      expect(prisma.usuario.update).not.toHaveBeenCalled();
      expect(prisma.usuarioNegocio.upsert).toHaveBeenCalled();
    });

    it('should roll back with ConflictError and not touch the usuario when the invitacion is no longer valid (count 0)', async () => {
      prisma.invitacion.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repo.acceptExistingUser({
          usuarioId: 3,
          negocioId: 1,
          rol: 'STAFF',
          invitacionId: 5,
          tokenHash: 'hash',
          setPassword: true,
          password: 'hashed',
        }),
      ).rejects.toThrow(ConflictError);
      expect(prisma.usuario.update).not.toHaveBeenCalled();
      expect(prisma.usuarioNegocio.upsert).not.toHaveBeenCalled();
    });
  });
});
