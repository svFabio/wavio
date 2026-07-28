import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRepository } from './auth.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildNegocio, buildUsuario, buildUsuarioNegocio } from '../__tests__/factories';

describe('AuthRepository', () => {
  let prisma: MockPrisma;
  let repo: AuthRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      if (typeof arg === 'function') return arg(prisma);
      return arg;
    });
    repo = new AuthRepository(prisma as never);
  });

  describe('findNegocioByGoogleId', () => {
    it('should return negocio when found', async () => {
      const negocio = buildNegocio({ googleId: 'g-123' });
      prisma.negocio.findUnique.mockResolvedValue(negocio);

      const result = await repo.findNegocioByGoogleId('g-123');

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'g-123' },
        select: expect.any(Object),
      });
      expect(result).toEqual(negocio);
    });

    it('should return null when not found', async () => {
      prisma.negocio.findUnique.mockResolvedValue(null);

      const result = await repo.findNegocioByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createNegocioWithAdmin', () => {
    it('should create negocio, usuario, and membership', async () => {
      const negocio = buildNegocio({ googleId: 'g-123' });
      const usuario = buildUsuario({ email: 'test@test.com', rol: 'ADMIN' });

      prisma.negocio.create.mockResolvedValue(negocio);
      prisma.usuario.create.mockResolvedValue(usuario);
      prisma.usuarioNegocio.create.mockResolvedValue(buildUsuarioNegocio(usuario.id, negocio.id));

      const result = await repo.createNegocioWithAdmin('g-123', 'test@test.com', 'Test');

      expect(prisma.negocio.create).toHaveBeenCalledWith({
        data: { googleId: 'g-123', email: 'test@test.com', nombre: 'Test' },
        select: expect.any(Object),
      });
      expect(prisma.usuario.create).toHaveBeenCalled();
      expect(prisma.usuarioNegocio.create).toHaveBeenCalled();
      expect(result).toEqual(negocio);
    });
  });

  describe('findUsuarioByNegocioAndGoogleId', () => {
    it('should return usuario when found', async () => {
      const usuario = buildUsuario({ googleId: 'g-123' });
      prisma.usuario.findFirst.mockResolvedValue(usuario);

      const result = await repo.findUsuarioByNegocioAndGoogleId(1, 'g-123');

      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { googleId: 'g-123', usuarioNegocios: { some: { negocioId: 1 } } },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });

    it('should return null when not found', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      const result = await repo.findUsuarioByNegocioAndGoogleId(1, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUsuarioById', () => {
    it('should return usuario by id', async () => {
      const usuario = buildUsuario({ id: 42 });
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await repo.findUsuarioById(42);

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });

    it('should return null when not found', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const result = await repo.findUsuarioById(999);

      expect(result).toBeNull();
    });
  });

  describe('findUsuarioByEmail', () => {
    it('should return usuario with password when found', async () => {
      const usuario = buildUsuario({ email: 'test@test.com' });
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await repo.findUsuarioByEmail('test@test.com');

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(result).toEqual(usuario);
    });

    it('should return null when not found', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const result = await repo.findUsuarioByEmail('nonexistent@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findUsuarioByNegocioId', () => {
    it('should return first usuario for negocio', async () => {
      const usuario = buildUsuario();
      prisma.usuario.findFirst.mockResolvedValue(usuario);

      const result = await repo.findUsuarioByNegocioId(1);

      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { usuarioNegocios: { some: { negocioId: 1 } } },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });
  });

  describe('findNegociosByUsuarioId', () => {
    it('should return negocios for usuario', async () => {
      const negocio1 = buildNegocio();
      const negocio2 = buildNegocio();
      const memberships = [{ negocio: negocio1 }, { negocio: negocio2 }];

      prisma.usuarioNegocio.findMany.mockResolvedValue(memberships);

      const result = await repo.findNegociosByUsuarioId(1);

      expect(prisma.usuarioNegocio.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        select: { negocio: { select: expect.any(Object) } },
      });
      expect(result).toEqual([negocio1, negocio2]);
    });

    it('should return empty array when no memberships', async () => {
      prisma.usuarioNegocio.findMany.mockResolvedValue([]);

      const result = await repo.findNegociosByUsuarioId(1);

      expect(result).toEqual([]);
    });
  });

  describe('findFirstByGoogleId', () => {
    it('should return id when found', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 1 });

      const result = await repo.findFirstByGoogleId('g-123');

      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { googleId: 'g-123' },
        select: { id: true },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should return null when not found', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      const result = await repo.findFirstByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('upsertMembership', () => {
    it('should upsert usuarioNegocio membership', async () => {
      const membership = { usuarioId: 1, negocioId: 1, rol: 'STAFF' };
      prisma.usuarioNegocio.upsert.mockResolvedValue(membership);

      const result = await repo.upsertMembership(1, 1, 'STAFF');

      expect(prisma.usuarioNegocio.upsert).toHaveBeenCalledWith({
        where: { usuarioId_negocioId: { usuarioId: 1, negocioId: 1 } },
        update: {},
        create: { usuarioId: 1, negocioId: 1, rol: 'STAFF' },
      });
      expect(result).toEqual(membership);
    });
  });

  describe('findUsuarioNegocioMembership', () => {
    it('should return membership when found', async () => {
      const membership = { usuarioId: 1, negocioId: 1, rol: 'ADMIN' };
      prisma.usuarioNegocio.findUnique.mockResolvedValue(membership);

      const result = await repo.findUsuarioNegocioMembership(1, 1);

      expect(prisma.usuarioNegocio.findUnique).toHaveBeenCalledWith({
        where: { usuarioId_negocioId: { usuarioId: 1, negocioId: 1 } },
      });
      expect(result).toEqual(membership);
    });

    it('should return null when not found', async () => {
      prisma.usuarioNegocio.findUnique.mockResolvedValue(null);

      const result = await repo.findUsuarioNegocioMembership(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('updateUsuario', () => {
    it('should update usuario fields', async () => {
      const updated = {
        id: 1,
        nombre: 'New Name',
        email: 'test@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
      };
      prisma.usuario.update.mockResolvedValue(updated);

      const result = await repo.updateUsuario(1, { nombre: 'New Name' });

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nombre: 'New Name' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });
  });
});
