import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesRepository } from './clientes.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildCliente } from '../__tests__/factories';
import { NotFoundError } from '../domain/errors';

describe('ClientesRepository', () => {
  let prisma: MockPrisma;
  let repo: ClientesRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new ClientesRepository(prisma as never);
  });

  describe('findByNegocioId', () => {
    it('should return paginated clientes', async () => {
      const clientes = [
        buildCliente(1, { id: 1, nombre: 'Cliente A' }),
        buildCliente(1, { id: 2, nombre: 'Cliente B' }),
      ];
      prisma.cliente.findMany.mockResolvedValue(clientes);
      prisma.cliente.count.mockResolvedValue(20);

      const result = await repo.findByNegocioId(1, 2, 10);

      expect(prisma.cliente.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        orderBy: { nombre: 'asc' },
        skip: 10,
        take: 10,
      });
      expect(prisma.cliente.count).toHaveBeenCalledWith({ where: { negocioId: 1 } });
      expect(result).toEqual({
        data: clientes,
        total: 20,
        page: 2,
        limit: 10,
        totalPages: 2,
      });
    });

    it('should use default pagination', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);
      prisma.cliente.count.mockResolvedValue(0);

      await repo.findByNegocioId(1);

      expect(prisma.cliente.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        orderBy: { nombre: 'asc' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('findById', () => {
    it('should return cliente when found', async () => {
      const cliente = buildCliente(1, { id: 1 });
      prisma.cliente.findFirst.mockResolvedValue(cliente);

      const result = await repo.findById(1, 1);

      expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 1 },
      });
      expect(result).toEqual(cliente);
    });

    it('should return null when not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      const result = await repo.findById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('findByTelefono', () => {
    it('should return cliente when found by telefono', async () => {
      const cliente = buildCliente(1, { telefono: '+521234567890' });
      prisma.cliente.findUnique.mockResolvedValue(cliente);

      const result = await repo.findByTelefono('+521234567890', 1);

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { negocioId_telefono: { negocioId: 1, telefono: '+521234567890' } },
      });
      expect(result).toEqual(cliente);
    });

    it('should return null when not found', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      const result = await repo.findByTelefono('+529999999999', 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return cliente', async () => {
      const cliente = buildCliente(1, { nombre: 'Juan', telefono: '+521234567890' });
      prisma.cliente.create.mockResolvedValue(cliente);

      const result = await repo.create({
        negocioId: 1,
        nombre: 'Juan',
        telefono: '+521234567890',
      });

      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: { negocioId: 1, nombre: 'Juan', telefono: '+521234567890' },
      });
      expect(result).toEqual(cliente);
    });
  });

  describe('update', () => {
    it('should update cliente when found', async () => {
      const existing = buildCliente(1, { id: 1 });
      const updated = buildCliente(1, { id: 1, nombre: 'Updated' });
      prisma.cliente.findFirst.mockResolvedValue(existing);
      prisma.cliente.update.mockResolvedValue(updated);

      const result = await repo.update(1, 1, { nombre: 'Updated' });

      expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 1 },
      });
      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nombre: 'Updated' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when cliente not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      await expect(repo.update(999, 1, { nombre: 'Nope' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete cliente when found', async () => {
      const existing = buildCliente(1, { id: 1 });
      prisma.cliente.findFirst.mockResolvedValue(existing);
      prisma.cliente.delete.mockResolvedValue(existing as never);

      await repo.delete(1, 1);

      expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 1 },
      });
      expect(prisma.cliente.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundError when cliente not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      await expect(repo.delete(999, 1)).rejects.toThrow(NotFoundError);
    });
  });
});
