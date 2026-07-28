import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiciosRepository } from './servicios.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildServicio, resetIds } from '../__tests__/factories';

describe('ServiciosRepository', () => {
  let repo: ServiciosRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    prisma.servicio.groupBy = vi.fn();
    repo = new ServiciosRepository(prisma as unknown as never);
  });

  describe('findByNegocioId', () => {
    it('should return active servicios ordered by nombre', async () => {
      const servicios = [
        buildServicio(1, { nombre: 'Barba' }),
        buildServicio(1, { nombre: 'Corte' }),
      ];
      prisma.servicio.findMany.mockResolvedValue(servicios);

      const result = await repo.findByNegocioId(1);

      expect(prisma.servicio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].precio).toBe(250);
    });

    it('should return empty array when none exist', async () => {
      prisma.servicio.findMany.mockResolvedValue([]);

      const result = await repo.findByNegocioId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return servicio when found', async () => {
      const servicio = buildServicio(1, { id: 10 });
      prisma.servicio.findUnique.mockResolvedValue(servicio);

      const result = await repo.findById(10);

      expect(prisma.servicio.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(10);
    });

    it('should return null when not found', async () => {
      prisma.servicio.findUnique.mockResolvedValue(null);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a servicio', async () => {
      const created = buildServicio(1, { id: 5, nombre: 'Corte' });
      prisma.servicio.create.mockResolvedValue(created);

      const result = await repo.create({
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
      });

      expect(prisma.servicio.create).toHaveBeenCalledWith({
        data: {
          negocioId: 1,
          nombre: 'Corte',
          duracionMinutos: 60,
          bufferMinutos: 10,
          precio: 250,
          activo: true,
        },
      });
      expect(result.id).toBe(5);
    });
  });

  describe('update', () => {
    it('should update and return the servicio', async () => {
      const updated = buildServicio(1, { id: 3, nombre: 'Corte Premium', precio: 350 });
      prisma.servicio.update.mockResolvedValue(updated);

      const result = await repo.update(3, { nombre: 'Corte Premium', precio: 350 });

      expect(prisma.servicio.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { nombre: 'Corte Premium', precio: 350 },
      });
      expect(result.nombre).toBe('Corte Premium');
    });
  });

  describe('softDelete', () => {
    it('should set activo to false', async () => {
      const deleted = buildServicio(1, { id: 7, activo: false });
      prisma.servicio.update.mockResolvedValue(deleted);

      const result = await repo.softDelete(7);

      expect(prisma.servicio.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { activo: false },
      });
      expect(result.activo).toBe(false);
    });
  });

  describe('findByCategoria', () => {
    it('should filter by negocioId and categoria', async () => {
      const servicios = [buildServicio(1, { nombre: 'Corte', categoria: 'Cabello' })];
      prisma.servicio.findMany.mockResolvedValue(servicios);

      const result = await repo.findByCategoria(1, 'Cabello');

      expect(prisma.servicio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true, categoria: 'Cabello' },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getCategorias', () => {
    it('should group by categoria', async () => {
      prisma.servicio.groupBy.mockResolvedValue([
        { categoria: 'Cabello', _count: { id: 2 } },
        { categoria: 'Barba', _count: { id: 1 } },
      ]);

      const result = await repo.getCategorias(1);

      expect(result).toEqual([
        { categoria: 'Cabello', count: 2 },
        { categoria: 'Barba', count: 1 },
      ]);
    });

    it('should return Sin categoría when categoria is null', async () => {
      prisma.servicio.groupBy.mockResolvedValue([{ categoria: null, _count: { id: 3 } }]);

      const result = await repo.getCategorias(1);

      expect(result).toEqual([{ categoria: 'Sin categoría', count: 3 }]);
    });
  });

  describe('findAllByCategoria', () => {
    it('should group servicios by categoria', async () => {
      const servicios = [
        buildServicio(1, { nombre: 'Corte', categoria: 'Cabello' }),
        buildServicio(1, { nombre: 'Barba', categoria: 'Barba' }),
        buildServicio(1, { nombre: 'Tintura', categoria: 'Cabello' }),
      ];
      prisma.servicio.findMany.mockResolvedValue(servicios);

      const result = await repo.findAllByCategoria(1);

      expect(result).toHaveLength(2);
      const cabello = result.find((g) => g.categoria === 'Cabello');
      expect(cabello?.servicios).toHaveLength(2);
      const barba = result.find((g) => g.categoria === 'Barba');
      expect(barba?.servicios).toHaveLength(1);
    });
  });
});
