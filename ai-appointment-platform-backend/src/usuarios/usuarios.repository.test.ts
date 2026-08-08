import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuariosRepository } from './usuarios.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildUsuario } from '../__tests__/factories';

describe('UsuariosRepository', () => {
  let prisma: MockPrisma;
  let repo: UsuariosRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') return arg(prisma);
      return arg;
    });
    repo = new UsuariosRepository(prisma as never);
  });

  describe('findByNegocioId', () => {
    it('should return paginated usuarios', async () => {
      const usuarios = [
        buildUsuario({ id: 1, nombre: 'Staff 1' }),
        buildUsuario({ id: 2, nombre: 'Staff 2' }),
      ];
      prisma.usuario.findMany.mockResolvedValue(usuarios);
      prisma.usuario.count.mockResolvedValue(10);

      const result = await repo.findByNegocioId(1, 2, 5);

      expect(prisma.usuario.findMany).toHaveBeenCalledWith({
        where: { usuarioNegocios: { some: { negocioId: 1 } } },
        select: expect.any(Object),
        orderBy: { creadoEn: 'desc' },
        skip: 5,
        take: 5,
      });
      expect(prisma.usuario.count).toHaveBeenCalledWith({
        where: { usuarioNegocios: { some: { negocioId: 1 } } },
      });
      expect(result).toEqual({ data: usuarios, total: 10, page: 2, limit: 5 });
    });

    it('should return empty when no usuarios', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      prisma.usuario.count.mockResolvedValue(0);

      const result = await repo.findByNegocioId(1, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findByEmail', () => {
    it('should return usuario with password when found', async () => {
      const usuario = { ...buildUsuario({ email: 'test@test.com' }), password: 'hashed' };
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      const result = await repo.findByEmail('test@test.com');

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });

    it('should return null when not found', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const result = await repo.findByEmail('nonexistent@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndNegocioId', () => {
    it('should return usuario when found with matching negocio', async () => {
      const usuario = buildUsuario({ id: 1 });
      prisma.usuario.findFirst.mockResolvedValue(usuario);

      const result = await repo.findByIdAndNegocioId(1, 1);

      expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
        where: { id: 1, usuarioNegocios: { some: { negocioId: 1 } } },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });

    it('should return null when not found', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndNegocioId(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create usuario without negocioId', async () => {
      const usuario = buildUsuario({ nombre: 'New Staff', email: 'new@test.com', rol: 'STAFF' });
      prisma.usuario.create.mockResolvedValue(usuario);

      const result = await repo.create({
        nombre: 'New Staff',
        email: 'new@test.com',
        password: 'secret123',
        rol: 'STAFF',
      });

      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: { nombre: 'New Staff', email: 'new@test.com', password: 'secret123', rol: 'STAFF' },
        select: expect.any(Object),
      });
      expect(result).toEqual(usuario);
    });

    it('should create usuario with negocioId and membership via transaction', async () => {
      const usuario = buildUsuario({ nombre: 'Staff', email: 'staff@test.com', rol: 'STAFF' });
      prisma.usuario.create.mockResolvedValue(usuario);

      const result = await repo.create({
        nombre: 'Staff',
        email: 'staff@test.com',
        password: 'secret123',
        rol: 'STAFF',
        negocioId: 1,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.usuario.create).toHaveBeenCalled();
      expect(prisma.usuarioNegocio.create).toHaveBeenCalledWith({
        data: { usuarioId: usuario.id, negocioId: 1, rol: 'STAFF' },
      });
      expect(result).toEqual(usuario);
    });
  });

  describe('update', () => {
    it('should update usuario fields', async () => {
      const updated = {
        id: 1,
        nombre: 'Updated',
        email: 'test@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
      };
      prisma.usuario.update.mockResolvedValue(updated);

      const result = await repo.update(1, { nombre: 'Updated' });

      expect(prisma.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nombre: 'Updated' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete usuario by id', async () => {
      prisma.usuario.delete.mockResolvedValue({ id: 1 } as never);

      await repo.delete(1);

      expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findFirstByGoogleId', () => {
    it('should return id when found', async () => {
      prisma.usuario.findFirst.mockResolvedValue({ id: 1 });

      const result = await repo.findFirstByGoogleId('g-123');

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when not found', async () => {
      prisma.usuario.findFirst.mockResolvedValue(null);

      const result = await repo.findFirstByGoogleId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('countAdminsByNegocio', () => {
    it('should count ADMIN and OWNER users of the negocio', async () => {
      prisma.usuario.count.mockResolvedValue(2);

      const result = await repo.countAdminsByNegocio(1);

      expect(prisma.usuario.count).toHaveBeenCalledWith({
        where: {
          rol: { in: ['ADMIN', 'OWNER'] },
          usuarioNegocios: { some: { negocioId: 1 } },
        },
      });
      expect(result).toBe(2);
    });

    it('should return 0 when no admins', async () => {
      prisma.usuario.count.mockResolvedValue(0);

      const result = await repo.countAdminsByNegocio(1);

      expect(result).toBe(0);
    });
  });
});
