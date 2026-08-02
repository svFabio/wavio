import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorariosNegocioRepository } from './horariosNegocio.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildHorarioNegocio, resetIds } from '../__tests__/factories';

describe('HorariosNegocioRepository', () => {
  let repo: HorariosNegocioRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new HorariosNegocioRepository(prisma as unknown as never);
  });

  describe('findByNegocioId', () => {
    it('should return active horarios ordered by dia and hora', async () => {
      const horarios = [
        buildHorarioNegocio(1, { diaSemana: 1, horaInicio: '09:00' }),
        buildHorarioNegocio(1, { diaSemana: 2, horaInicio: '10:00' }),
      ];
      prisma.horarioNegocio.findMany.mockResolvedValue(horarios);

      const result = await repo.findByNegocioId(1);

      expect(prisma.horarioNegocio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true },
        orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty when none exist', async () => {
      prisma.horarioNegocio.findMany.mockResolvedValue([]);

      const result = await repo.findByNegocioId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByNegocioIdYDia', () => {
    it('should filter by negocioId and diaSemana', async () => {
      const horarios = [buildHorarioNegocio(1, { diaSemana: 1, horaInicio: '09:00' })];
      prisma.horarioNegocio.findMany.mockResolvedValue(horarios);

      const result = await repo.findByNegocioIdYDia(1, 1);

      expect(prisma.horarioNegocio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, diaSemana: 1, activo: true },
        orderBy: { horaInicio: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty when no horarios for that day', async () => {
      prisma.horarioNegocio.findMany.mockResolvedValue([]);

      const result = await repo.findByNegocioIdYDia(1, 5);

      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('should create a new horario', async () => {
      const created = buildHorarioNegocio(1, {
        diaSemana: 3,
        horaInicio: '10:00',
        horaFin: '14:00',
      });
      prisma.horarioNegocio.upsert.mockResolvedValue(created);

      const result = await repo.upsert(1, 3, '10:00', '14:00');

      expect(prisma.horarioNegocio.upsert).toHaveBeenCalledWith({
        where: {
          negocioId_diaSemana_horaInicio: { negocioId: 1, diaSemana: 3, horaInicio: '10:00' },
        },
        update: { horaFin: '14:00', activo: true },
        create: { negocioId: 1, diaSemana: 3, horaInicio: '10:00', horaFin: '14:00', activo: true },
      });
      expect(result.diaSemana).toBe(3);
    });
  });

  describe('deleteByNegocioId', () => {
    it('should delete all horarios for negocio', async () => {
      prisma.horarioNegocio.deleteMany.mockResolvedValue({ count: 3 });

      const result = await repo.deleteByNegocioId(1);

      expect(prisma.horarioNegocio.deleteMany).toHaveBeenCalledWith({ where: { negocioId: 1 } });
      expect(result).toBe(3);
    });

    it('should return 0 when no horarios exist', async () => {
      prisma.horarioNegocio.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.deleteByNegocioId(999);

      expect(result).toBe(0);
    });
  });

  describe('deleteByNegocioIdYDia', () => {
    it('should delete horarios for negocio and dia', async () => {
      prisma.horarioNegocio.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repo.deleteByNegocioIdYDia(1, 1);

      expect(prisma.horarioNegocio.deleteMany).toHaveBeenCalledWith({
        where: { negocioId: 1, diaSemana: 1 },
      });
      expect(result).toBe(2);
    });
  });
});
