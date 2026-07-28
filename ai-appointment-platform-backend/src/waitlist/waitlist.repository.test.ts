import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistRepository } from './waitlist.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';

describe('WaitlistRepository', () => {
  let repository: WaitlistRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    repository = new WaitlistRepository(prisma as never);
  });

  describe('addToWaitlist', () => {
    it('should create a waitlist entry and return id', async () => {
      prisma.listaEspera.create.mockResolvedValue({ id: 1 });

      const result = await repository.addToWaitlist(1, {
        clienteNombre: 'María García',
        clienteTelefono: '+529876543210',
        fechaPreferida: new Date('2026-08-01'),
        horarioPreferido: '14:00',
      });

      expect(result).toEqual({ id: 1 });
      expect(prisma.listaEspera.create).toHaveBeenCalledWith({
        data: {
          negocioId: 1,
          clienteNombre: 'María García',
          clienteTelefono: '+529876543210',
          servicioId: null,
          fechaPreferida: new Date('2026-08-01'),
          horarioPreferido: '14:00',
        },
      });
    });

    it('should create a waitlist entry with servicioId', async () => {
      prisma.listaEspera.create.mockResolvedValue({ id: 2 });

      const result = await repository.addToWaitlist(1, {
        clienteNombre: 'María García',
        clienteTelefono: '+529876543210',
        servicioId: 5,
        fechaPreferida: new Date('2026-08-01'),
      });

      expect(result).toEqual({ id: 2 });
      expect(prisma.listaEspera.create).toHaveBeenCalledWith({
        data: {
          negocioId: 1,
          clienteNombre: 'María García',
          clienteTelefono: '+529876543210',
          servicioId: 5,
          fechaPreferida: new Date('2026-08-01'),
          horarioPreferido: null,
        },
      });
    });
  });

  describe('getPendingForDate', () => {
    it('should return pending entries for a given date', async () => {
      const fecha = new Date(2026, 7, 1);
      const mockEntries = [
        {
          id: 1,
          clienteNombre: 'María García',
          clienteTelefono: '+529876543210',
          servicioId: null,
          horarioPreferido: '14:00',
          creadoEn: new Date('2026-08-01T10:00:00Z'),
        },
      ];
      prisma.listaEspera.findMany.mockResolvedValue(mockEntries);

      const result = await repository.getPendingForDate(1, fecha);

      expect(result).toEqual(mockEntries);
      expect(prisma.listaEspera.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          estado: 'PENDIENTE',
          fechaPreferida: {
            gte: new Date(2026, 7, 1),
            lt: new Date(2026, 7, 2),
          },
        },
        orderBy: { creadoEn: 'asc' },
      });
    });
  });

  describe('markNotified', () => {
    it('should mark entry as notified', async () => {
      prisma.listaEspera.update.mockResolvedValue({ id: 1 });

      await repository.markNotified(1);

      expect(prisma.listaEspera.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'NOTIFICADA', notificadoEn: expect.any(Date) },
      });
    });
  });

  describe('confirmEntry', () => {
    it('should mark entry as confirmed', async () => {
      prisma.listaEspera.update.mockResolvedValue({ id: 1 });

      await repository.confirmEntry(1);

      expect(prisma.listaEspera.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'CONFIRMADA' },
      });
    });
  });

  describe('cancelEntry', () => {
    it('should mark entry as cancelled', async () => {
      prisma.listaEspera.update.mockResolvedValue({ id: 1 });

      await repository.cancelEntry(1);

      expect(prisma.listaEspera.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'CANCELADA' },
      });
    });
  });

  describe('getAll', () => {
    it('should return all entries ordered by creadoEn desc', async () => {
      const mockEntries = [
        {
          id: 2,
          clienteNombre: 'Nuevo Cliente',
          clienteTelefono: '+521111111111',
          negocioId: 1,
          creadoEn: new Date('2026-08-02'),
        },
      ];
      prisma.listaEspera.findMany.mockResolvedValue(mockEntries);

      const result = await repository.getAll(1);

      expect(result).toEqual(mockEntries);
      expect(prisma.listaEspera.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        orderBy: { creadoEn: 'desc' },
      });
    });
  });

  describe('getWaitlistCount', () => {
    it('should return count of pending entries', async () => {
      prisma.listaEspera.count.mockResolvedValue(3);

      const result = await repository.getWaitlistCount(1);

      expect(result).toBe(3);
      expect(prisma.listaEspera.count).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'PENDIENTE' },
      });
    });
  });
});
