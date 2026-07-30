import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorariosStaffRepository } from './horariosStaff.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildHorarioStaff, resetIds } from '../__tests__/factories';

describe('HorariosStaffRepository', () => {
  let repo: HorariosStaffRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new HorariosStaffRepository(prisma as unknown as never);
  });

  describe('findByUsuarioId', () => {
    it('should return active horarios for user', async () => {
      const horarios = [
        buildHorarioStaff(1, { diaSemana: 1 }),
        buildHorarioStaff(1, { diaSemana: 2 }),
      ];
      prisma.horarioStaff.findMany.mockResolvedValue(horarios);

      const result = await repo.findByUsuarioId(1);

      expect(prisma.horarioStaff.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1, activo: true },
        orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty when user has no horarios', async () => {
      prisma.horarioStaff.findMany.mockResolvedValue([]);

      const result = await repo.findByUsuarioId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByUsuarioIdYDia', () => {
    it('should filter by usuarioId and diaSemana', async () => {
      const horarios = [buildHorarioStaff(1, { diaSemana: 1, horaInicio: '09:00' })];
      prisma.horarioStaff.findMany.mockResolvedValue(horarios);

      const result = await repo.findByUsuarioIdYDia(1, 1);

      expect(prisma.horarioStaff.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1, diaSemana: 1, activo: true },
        orderBy: { horaInicio: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByNegocioId', () => {
    it('should return staff horarios for a negocio', async () => {
      const rows = [
        { usuarioId: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '17:00' },
        { usuarioId: 2, diaSemana: 1, horaInicio: '10:00', horaFin: '18:00' },
      ];
      prisma.horarioStaff.findMany.mockResolvedValue(rows);

      const result = await repo.findByNegocioId(1);

      expect(prisma.horarioStaff.findMany).toHaveBeenCalledWith({
        where: { usuario: { usuarioNegocios: { some: { negocioId: 1 } } }, activo: true },
        select: { usuarioId: true, diaSemana: true, horaInicio: true, horaFin: true },
        orderBy: [{ usuarioId: 'asc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }],
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('upsert', () => {
    it('should upsert a staff horario', async () => {
      const created = buildHorarioStaff(1, { diaSemana: 3, horaInicio: '09:00', horaFin: '15:00' });
      prisma.horarioStaff.upsert.mockResolvedValue(created);

      const result = await repo.upsert(1, 3, '09:00', '15:00');

      expect(prisma.horarioStaff.upsert).toHaveBeenCalledWith({
        where: {
          usuarioId_diaSemana_horaInicio: { usuarioId: 1, diaSemana: 3, horaInicio: '09:00' },
        },
        update: { horaFin: '15:00', activo: true },
        create: { usuarioId: 1, diaSemana: 3, horaInicio: '09:00', horaFin: '15:00', activo: true },
      });
      expect(result.diaSemana).toBe(3);
    });
  });

  describe('deleteByUsuarioId', () => {
    it('should delete all horarios for a user', async () => {
      prisma.horarioStaff.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repo.deleteByUsuarioId(1);

      expect(prisma.horarioStaff.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 1 } });
      expect(result).toBe(5);
    });
  });

  describe('getAvailableStaffForSlot', () => {
    it('should return staff ids available for the slot', async () => {
      prisma.horarioStaff.findMany.mockResolvedValue([{ usuarioId: 1 }, { usuarioId: 2 }]);

      const result = await repo.getAvailableStaffForSlot(1, 1, '10:00');

      expect(prisma.horarioStaff.findMany).toHaveBeenCalledWith({
        where: {
          usuario: { usuarioNegocios: { some: { negocioId: 1 } } },
          diaSemana: 1,
          activo: true,
          horaInicio: { lte: '10:00' },
          horaFin: { gt: '10:00' },
        },
        select: { usuarioId: true },
      });
      expect(result).toEqual([1, 2]);
    });

    it('should return empty array when no staff available', async () => {
      prisma.horarioStaff.findMany.mockResolvedValue([]);

      const result = await repo.getAvailableStaffForSlot(1, 1, '20:00');

      expect(result).toEqual([]);
    });
  });
});
