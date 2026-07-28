import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatisticsRepository } from './statistics.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildCita, resetIds, today, daysFromNow } from '../__tests__/factories';
import type { PrismaService } from '../prisma/prisma.service';

describe('StatisticsRepository', () => {
  let prisma: MockPrisma;
  let repo: StatisticsRepository;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new StatisticsRepository(prisma as unknown as PrismaService);
  });

  describe('countCitasMes', () => {
    it('should count citas excluding CANCELADA', async () => {
      prisma.cita.count.mockResolvedValue(10);

      const result = await repo.countCitasMes(1, today(), daysFromNow(30));

      expect(prisma.cita.count).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(30) },
          estado: { not: 'CANCELADA' },
        },
      });
      expect(result).toBe(10);
    });
  });

  describe('getCitasConfirmadasMonto', () => {
    it('should return monto for confirmed citas', async () => {
      const montos = [{ monto: 250 }, { monto: 150 }];
      prisma.cita.findMany.mockResolvedValue(montos);

      const result = await repo.getCitasConfirmadasMonto(1, today(), daysFromNow(30));

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(30) },
          estado: 'CONFIRMADA',
        },
        select: { monto: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getTopClientes', () => {
    it('should return top clientes via $queryRaw', async () => {
      const topClientes = [
        { clienteTelefono: '+521234567890', clienteNombre: 'Juan Pérez', totalCitas: 5 },
        { clienteTelefono: '+529876543210', clienteNombre: 'María García', totalCitas: 3 },
      ];
      prisma.$queryRaw.mockResolvedValue(topClientes);

      const result = await repo.getTopClientes(1);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].clienteTelefono).toBe('+521234567890');
      expect(result[0].totalCitas).toBe(5);
    });
  });

  describe('getHorariosPopulares', () => {
    it('should return popular horarios via groupBy', async () => {
      const horarios = [
        { horario: '10:00', _count: { id: 5 } },
        { horario: '11:00', _count: { id: 3 } },
      ];
      prisma.cita.groupBy.mockResolvedValue(horarios);

      const result = await repo.getHorariosPopulares(1);

      expect(prisma.cita.groupBy).toHaveBeenCalledWith({
        by: ['horario'],
        _count: { id: true },
        where: { negocioId: 1, estado: { not: 'CANCELADA' } },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });
      expect(result).toHaveLength(2);
      expect(result[0].horario).toBe('10:00');
      expect(result[0]._count.id).toBe(5);
    });
  });

  describe('getRatingPromedio', () => {
    it('should return average rating', async () => {
      prisma.cita.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });

      const result = await repo.getRatingPromedio(1);

      expect(prisma.cita.aggregate).toHaveBeenCalledWith({
        _avg: { rating: true },
        where: { negocioId: 1, rating: { not: null } },
      });
      expect(result).toBe(4.5);
    });

    it('should return 0 when no ratings exist', async () => {
      prisma.cita.aggregate.mockResolvedValue({ _avg: { rating: null } });

      const result = await repo.getRatingPromedio(1);

      expect(result).toBe(0);
    });
  });

  describe('getUltimosComentarios', () => {
    it('should return latest comments with ratings', async () => {
      const comentarios = [
        { clienteNombre: 'Juan Pérez', rating: 5, comentario: 'Excelente', fecha: today() },
        { clienteNombre: 'María García', rating: 4, comentario: 'Muy bien', fecha: today() },
      ];
      prisma.cita.findMany.mockResolvedValue(comentarios);

      const result = await repo.getUltimosComentarios(1);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, comentario: { not: null }, estado: { not: 'CANCELADA' } },
        orderBy: { fecha: 'desc' },
        take: 5,
        select: { clienteNombre: true, rating: true, comentario: true, fecha: true },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no comments', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.getUltimosComentarios(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('countCitasPorOrigen', () => {
    it('should count citas by origin', async () => {
      prisma.cita.count.mockResolvedValue(7);

      const result = await repo.countCitasPorOrigen(1, today(), daysFromNow(30), 'whatsapp');

      expect(prisma.cita.count).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(30) },
          estado: { not: 'CANCELADA' },
          origen: 'whatsapp',
        },
      });
      expect(result).toBe(7);
    });
  });

  describe('getCitasIngresos', () => {
    it('should return monthly ingresos via $queryRaw', async () => {
      const ingresos = [
        { mes: '2026-01', total: 1000 },
        { mes: '2026-02', total: 1500 },
      ];
      prisma.$queryRaw.mockResolvedValue(ingresos);

      const result = await repo.getCitasIngresos(1, new Date('2026-01-01'));

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].mes).toBe('2026-01');
    });
  });
});
