import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorariosEspecialesRepository } from './horariosEspeciales.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildHorarioEspecial, resetIds, daysFromNow } from '../__tests__/factories';

describe('HorariosEspecialesRepository', () => {
  let repo: HorariosEspecialesRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new HorariosEspecialesRepository(prisma as unknown as never);
  });

  describe('findByNegocioId', () => {
    it('should return all horarios especiales for negocio', async () => {
      const horarios = [
        buildHorarioEspecial(1, { fecha: daysFromNow(1) }),
        buildHorarioEspecial(1, { fecha: daysFromNow(2) }),
      ];
      prisma.horarioEspecial.findMany.mockResolvedValue(horarios);

      const result = await repo.findByNegocioId(1);

      expect(prisma.horarioEspecial.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        orderBy: { fecha: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty when none exist', async () => {
      prisma.horarioEspecial.findMany.mockResolvedValue([]);

      const result = await repo.findByNegocioId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByNegocioIdYFecha', () => {
    it('should return horario when found', async () => {
      const fecha = daysFromNow(5);
      const horario = buildHorarioEspecial(1, { fecha });
      prisma.horarioEspecial.findFirst.mockResolvedValue(horario);

      const result = await repo.findByNegocioIdYFecha(1, fecha);

      expect(prisma.horarioEspecial.findFirst).toHaveBeenCalledWith({
        where: { negocioId: 1, fecha },
      });
      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      prisma.horarioEspecial.findFirst.mockResolvedValue(null);

      const result = await repo.findByNegocioIdYFecha(1, daysFromNow(99));

      expect(result).toBeNull();
    });
  });

  describe('findByNegocioIdRange', () => {
    it('should return horarios within date range', async () => {
      const desde = daysFromNow(1);
      const hasta = daysFromNow(10);
      const horarios = [buildHorarioEspecial(1, { fecha: daysFromNow(5) })];
      prisma.horarioEspecial.findMany.mockResolvedValue(horarios);

      const result = await repo.findByNegocioIdRange(1, desde, hasta);

      expect(prisma.horarioEspecial.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, fecha: { gte: desde, lte: hasta } },
        orderBy: { fecha: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty when nothing in range', async () => {
      prisma.horarioEspecial.findMany.mockResolvedValue([]);

      const result = await repo.findByNegocioIdRange(1, daysFromNow(100), daysFromNow(110));

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a horario especial', async () => {
      const fecha = daysFromNow(5);
      const created = buildHorarioEspecial(1, {
        fecha,
        cerrado: false,
        horaInicio: '10:00',
        horaFin: '16:00',
      });
      prisma.horarioEspecial.create.mockResolvedValue(created);

      const result = await repo.create({
        negocioId: 1,
        fecha,
        cerrado: false,
        horaInicio: '10:00',
        horaFin: '16:00',
      });

      expect(prisma.horarioEspecial.create).toHaveBeenCalledWith({
        data: { negocioId: 1, fecha, cerrado: false, horaInicio: '10:00', horaFin: '16:00' },
      });
      expect(result.fecha).toEqual(fecha);
    });
  });

  describe('findById', () => {
    it('should return horario when found', async () => {
      const horario = buildHorarioEspecial(1, { id: 42 });
      prisma.horarioEspecial.findUnique.mockResolvedValue(horario);

      const result = await repo.findById(42);

      expect(prisma.horarioEspecial.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      prisma.horarioEspecial.findUnique.mockResolvedValue(null);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete and return the horario', async () => {
      const horario = buildHorarioEspecial(1, { id: 7 });
      prisma.horarioEspecial.delete.mockResolvedValue(horario);

      const result = await repo.deleteById(7);

      expect(prisma.horarioEspecial.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(result.id).toBe(7);
    });
  });
});
