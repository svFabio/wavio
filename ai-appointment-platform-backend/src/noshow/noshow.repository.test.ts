import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoShowRepository } from './noshow.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildCliente, buildCita, buildNegocio, resetIds } from '../__tests__/factories';

describe('NoShowRepository', () => {
  let repo: NoShowRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new NoShowRepository(prisma as unknown as never);
  });

  describe('markAsNoShow', () => {
    it('should update cita estado to NO_ASISTIO', async () => {
      prisma.cita.update.mockResolvedValue(buildCita(1));

      await repo.markAsNoShow(1);

      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'NO_ASISTIO' },
      });
    });
  });

  describe('findCitaById', () => {
    it('should return clienteTelefono when found', async () => {
      prisma.cita.findUnique.mockResolvedValue({ clienteTelefono: '+521234567890' });

      const result = await repo.findCitaById(1);

      expect(prisma.cita.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { clienteTelefono: true },
      });
      expect(result).toEqual({ clienteTelefono: '+521234567890' });
    });

    it('should return null when cita not found', async () => {
      prisma.cita.findUnique.mockResolvedValue(null);

      const result = await repo.findCitaById(999);

      expect(result).toBeNull();
    });
  });

  describe('incrementNoShowCount', () => {
    it('should increment and return new count', async () => {
      const cliente = buildCliente(1, { id: 10, telefono: '+521234567890', noShowCount: 2 });
      prisma.cliente.findFirst.mockResolvedValue(cliente);
      prisma.cliente.update.mockResolvedValue({ ...cliente, noShowCount: 3 });

      const result = await repo.incrementNoShowCount(1, '+521234567890');

      expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
        where: { negocioId: 1, telefono: '+521234567890' },
      });
      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { noShowCount: { increment: 1 } },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when cliente not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      const result = await repo.incrementNoShowCount(1, '+529999999999');

      expect(prisma.cliente.update).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('getNoShowStats', () => {
    it('should return clients with no-shows', async () => {
      prisma.cliente.findMany.mockResolvedValue([
        buildCliente(1, { nombre: 'Juan', telefono: '+521', noShowCount: 3, blocked: false }),
        buildCliente(1, { nombre: 'Ana', telefono: '+522', noShowCount: 1, blocked: true }),
      ]);

      const result = await repo.getNoShowStats(1);

      expect(prisma.cliente.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, noShowCount: { gt: 0 } },
        select: { nombre: true, telefono: true, noShowCount: true, blocked: true },
        orderBy: { noShowCount: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].clienteNombre).toBe('Juan');
      expect(result[0].noShowCount).toBe(3);
    });

    it('should return empty when no no-shows', async () => {
      prisma.cliente.findMany.mockResolvedValue([]);

      const result = await repo.getNoShowStats(1);

      expect(result).toEqual([]);
    });
  });

  describe('blockClient', () => {
    it('should set blocked to true', async () => {
      prisma.cliente.updateMany.mockResolvedValue({ count: 1 });

      await repo.blockClient(1, '+521234567890');

      expect(prisma.cliente.updateMany).toHaveBeenCalledWith({
        where: { negocioId: 1, telefono: '+521234567890' },
        data: { blocked: true },
      });
    });
  });

  describe('unblockClient', () => {
    it('should set blocked to false', async () => {
      prisma.cliente.updateMany.mockResolvedValue({ count: 1 });

      await repo.unblockClient(1, '+521234567890');

      expect(prisma.cliente.updateMany).toHaveBeenCalledWith({
        where: { negocioId: 1, telefono: '+521234567890' },
        data: { blocked: false },
      });
    });
  });

  describe('isClientBlocked', () => {
    it('should return true when cliente is blocked', async () => {
      prisma.cliente.findFirst.mockResolvedValue({ blocked: true });

      const result = await repo.isClientBlocked(1, '+521234567890');

      expect(result).toBe(true);
    });

    it('should return false when cliente is not blocked', async () => {
      prisma.cliente.findFirst.mockResolvedValue({ blocked: false });

      const result = await repo.isClientBlocked(1, '+521234567890');

      expect(result).toBe(false);
    });

    it('should return false when cliente not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      const result = await repo.isClientBlocked(1, '+529999999999');

      expect(result).toBe(false);
    });
  });

  describe('getActiveBusinessIds', () => {
    it('should return all negocio ids', async () => {
      prisma.negocio.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const result = await repo.getActiveBusinessIds();

      expect(prisma.negocio.findMany).toHaveBeenCalledWith({ select: { id: true } });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty when no negocios', async () => {
      prisma.negocio.findMany.mockResolvedValue([]);

      const result = await repo.getActiveBusinessIds();

      expect(result).toEqual([]);
    });
  });

  describe('getExpiredInProgressAppointments', () => {
    it('should return expired EN_PROCESO citas', async () => {
      const citas = [
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521',
          fecha: new Date('2026-01-01'),
          horario: '10:00',
        },
        {
          id: 2,
          clienteNombre: null,
          clienteTelefono: '+522',
          fecha: new Date('2026-01-02'),
          horario: '11:00',
        },
      ];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.getExpiredInProgressAppointments(1, 120);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'EN_PROCESO', fecha: { lt: expect.any(Date) } },
        select: {
          id: true,
          clienteNombre: true,
          clienteTelefono: true,
          fecha: true,
          horario: true,
        },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty when none expired', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.getExpiredInProgressAppointments(1, 120);

      expect(result).toEqual([]);
    });
  });
});
