import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityRepository } from './availability.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import {
  buildServicio,
  buildHorarioEspecial,
  buildHorarioNegocio,
  buildHorarioStaff,
  resetIds,
  today,
  daysFromNow,
} from '../__tests__/factories';
import type { PrismaService } from '../prisma/prisma.service';

describe('AvailabilityRepository', () => {
  let prisma: MockPrisma;
  let repo: AvailabilityRepository;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new AvailabilityRepository(prisma as unknown as PrismaService);
  });

  describe('findServicio', () => {
    it('should return servicio when found', async () => {
      const servicio = buildServicio(1);
      prisma.servicio.findFirst.mockResolvedValue(servicio);

      const result = await repo.findServicio(1, 1);

      expect(prisma.servicio.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 1, activo: true },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(servicio.id);
      expect(typeof result!.precio).toBe('number');
    });

    it('should return null when not found', async () => {
      prisma.servicio.findFirst.mockResolvedValue(null);

      const result = await repo.findServicio(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('findPrimerServicioActivo', () => {
    it('should return first active servicio', async () => {
      const servicio = buildServicio(1);
      prisma.servicio.findFirst.mockResolvedValue(servicio);

      const result = await repo.findPrimerServicioActivo(1);

      expect(prisma.servicio.findFirst).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true },
        orderBy: { id: 'asc' },
      });
      expect(result).not.toBeNull();
      expect(typeof result!.precio).toBe('number');
    });

    it('should return null when no active servicio', async () => {
      prisma.servicio.findFirst.mockResolvedValue(null);

      const result = await repo.findPrimerServicioActivo(1);

      expect(result).toBeNull();
    });
  });

  describe('findHorarioEspecial', () => {
    it('should return horario especial when found', async () => {
      const horario = buildHorarioEspecial(1);
      prisma.horarioEspecial.findFirst.mockResolvedValue(horario);

      const result = await repo.findHorarioEspecial(1, today());

      expect(prisma.horarioEspecial.findFirst).toHaveBeenCalledWith({
        where: { negocioId: 1, fecha: today() },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(horario.id);
    });

    it('should return null when not found', async () => {
      prisma.horarioEspecial.findFirst.mockResolvedValue(null);

      const result = await repo.findHorarioEspecial(1, today());

      expect(result).toBeNull();
    });
  });

  describe('findHorariosNegocio', () => {
    it('should return horarios for the given day', async () => {
      const horarios = [buildHorarioNegocio(1), buildHorarioNegocio(1, { diaSemana: 2 })];
      prisma.horarioNegocio.findMany.mockResolvedValue(horarios);

      const result = await repo.findHorariosNegocio(1, 1);

      expect(prisma.horarioNegocio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, diaSemana: 1, activo: true },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no horarios', async () => {
      prisma.horarioNegocio.findMany.mockResolvedValue([]);

      const result = await repo.findHorariosNegocio(1, 1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findHorarioStaff', () => {
    it('should return horario staff when found', async () => {
      const horario = buildHorarioStaff(1);
      prisma.horarioStaff.findFirst.mockResolvedValue(horario);

      const result = await repo.findHorarioStaff(1, 1);

      expect(prisma.horarioStaff.findFirst).toHaveBeenCalledWith({
        where: { usuarioId: 1, diaSemana: 1, activo: true },
      });
      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      prisma.horarioStaff.findFirst.mockResolvedValue(null);

      const result = await repo.findHorarioStaff(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('findCitasDelDia', () => {
    it('should return citas for the day without staff filter', async () => {
      const citas = [
        { horario: '10:00', duracionMinutos: 60 },
        { horario: '11:00', duracionMinutos: 30 },
      ];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.findCitasDelDia(1, today(), daysFromNow(1));

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(1) },
          estado: { notIn: ['CANCELADA'] },
        },
        select: { horario: true, duracionMinutos: true },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by staffId when provided', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      await repo.findCitasDelDia(1, today(), daysFromNow(1), 5);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(1) },
          estado: { notIn: ['CANCELADA'] },
          staffId: 5,
        },
        select: { horario: true, duracionMinutos: true },
      });
    });

    it('should return empty array when no citas', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.findCitasDelDia(1, today(), daysFromNow(1));

      expect(result).toHaveLength(0);
    });
  });

  describe('findCitasForRange', () => {
    it('should return citas for date range without staff filter', async () => {
      const citas = [{ fecha: today(), horario: '10:00', duracionMinutos: 60 }];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.findCitasForRange(1, today(), daysFromNow(7));

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(7) },
          estado: { notIn: ['CANCELADA'] },
        },
        select: { fecha: true, horario: true, duracionMinutos: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0].fecha).toEqual(today());
      expect(result[0].horario).toBe('10:00');
    });

    it('should filter by staffId when provided', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      await repo.findCitasForRange(1, today(), daysFromNow(7), 3);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(7) },
          estado: { notIn: ['CANCELADA'] },
          staffId: 3,
        },
        select: { fecha: true, horario: true, duracionMinutos: true },
      });
    });
  });

  describe('findHorariosNegocioAll', () => {
    it('should return all active horarios for negocio', async () => {
      const horarios = [
        buildHorarioNegocio(1, { diaSemana: 1 }),
        buildHorarioNegocio(1, { diaSemana: 2 }),
      ];
      prisma.horarioNegocio.findMany.mockResolvedValue(horarios);

      const result = await repo.findHorariosNegocioAll(1);

      expect(prisma.horarioNegocio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findHorariosEspecialesInRange', () => {
    it('should return horarios especiales within date range', async () => {
      const horarios = [buildHorarioEspecial(1)];
      prisma.horarioEspecial.findMany.mockResolvedValue(horarios);

      const result = await repo.findHorariosEspecialesInRange(1, today(), daysFromNow(30));

      expect(prisma.horarioEspecial.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(30) },
        },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findHorarioStaffAll', () => {
    it('should return all active horarios for staff', async () => {
      const horarios = [
        buildHorarioStaff(1, { diaSemana: 1 }),
        buildHorarioStaff(1, { diaSemana: 2 }),
      ];
      prisma.horarioStaff.findMany.mockResolvedValue(horarios);

      const result = await repo.findHorarioStaffAll(1);

      expect(prisma.horarioStaff.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1, activo: true },
      });
      expect(result).toHaveLength(2);
    });
  });
});
