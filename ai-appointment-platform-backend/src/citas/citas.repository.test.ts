import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CitasRepository } from './citas.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildCita, resetIds, today, daysFromNow } from '../__tests__/factories';
import type { PrismaService } from '../prisma/prisma.service';

describe('CitasRepository', () => {
  let prisma: MockPrisma;
  let repo: CitasRepository;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new CitasRepository(prisma as unknown as PrismaService);
  });

  describe('getPendientes', () => {
    it('should return paginated citas with VALIDACION_PENDIENTE state', async () => {
      const citas = [buildCita(1, { estado: 'VALIDACION_PENDIENTE' })];
      prisma.cita.findMany.mockResolvedValue(citas);
      prisma.cita.count.mockResolvedValue(1);

      const result = await repo.getPendientes(1, 1, 10);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'VALIDACION_PENDIENTE' },
        orderBy: { creadoEn: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prisma.cita.count).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'VALIDACION_PENDIENTE' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(typeof result.data[0].monto).toBe('number');
    });

    it('should handle pagination offset correctly', async () => {
      prisma.cita.findMany.mockResolvedValue([]);
      prisma.cita.count.mockResolvedValue(0);

      await repo.getPendientes(1, 3, 25);

      expect(prisma.cita.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 }),
      );
    });
  });

  describe('getAgenda', () => {
    it('should return citas within date range excluding CANCELADA', async () => {
      const desde = today();
      const hasta = daysFromNow(7);
      const citas = [buildCita(1)];
      prisma.cita.findMany.mockResolvedValue(citas);
      prisma.cita.count.mockResolvedValue(1);

      const result = await repo.getAgenda(1, desde, hasta, 1, 10);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: desde, lte: hasta },
          estado: { not: 'CANCELADA' },
        },
        orderBy: { fecha: 'asc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(typeof result.data[0].monto).toBe('number');
    });

    it('should return empty list when no citas in range', async () => {
      prisma.cita.findMany.mockResolvedValue([]);
      prisma.cita.count.mockResolvedValue(0);

      const result = await repo.getAgenda(1, today(), daysFromNow(7), 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getCitasCount', () => {
    it('should return count with merged where conditions', async () => {
      prisma.cita.count.mockResolvedValue(5);

      const result = await repo.getCitasCount(1, { estado: 'CONFIRMADA' });

      expect(prisma.cita.count).toHaveBeenCalledWith({
        where: { negocioId: 1, estado: 'CONFIRMADA' },
      });
      expect(result).toBe(5);
    });
  });

  describe('getProximasCitas', () => {
    it('should return upcoming citas excluding CANCELADA', async () => {
      const inicio = today();
      const fin = daysFromNow(1);
      const citas = [buildCita(1, { horario: '10:00' }), buildCita(1, { horario: '11:00' })];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.getProximasCitas(1, inicio, fin, 5);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: inicio, lte: fin },
          estado: { not: 'CANCELADA' },
        },
        orderBy: { horario: 'asc' },
        take: 5,
      });
      expect(result).toHaveLength(2);
      expect(typeof result[0].monto).toBe('number');
    });

    it('should return empty array when none found', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.getProximasCitas(1, today(), daysFromNow(1), 5);

      expect(result).toHaveLength(0);
    });
  });

  describe('getOcupadas', () => {
    it('should return occupied slots excluding CANCELADA', async () => {
      const inicio = today();
      const fin = daysFromNow(1);
      const ocupadas = [{ horario: '10:00' }, { horario: '11:00' }];
      prisma.cita.findMany.mockResolvedValue(ocupadas);

      const result = await repo.getOcupadas(1, inicio, fin);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: inicio, lte: fin },
          estado: { notIn: ['CANCELADA'] },
        },
        select: { horario: true },
      });
      expect(result).toHaveLength(2);
      expect(result[0].horario).toBe('10:00');
    });

    it('should return empty array when no ocupadas', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.getOcupadas(1, today(), daysFromNow(1));

      expect(result).toHaveLength(0);
    });
  });

  describe('getByIdAndNegocio', () => {
    it('should return cita when found', async () => {
      const cita = buildCita(1);
      prisma.cita.findFirst.mockResolvedValue(cita);

      const result = await repo.getByIdAndNegocio(1, 1);

      expect(prisma.cita.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 1 },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe(cita.id);
      expect(typeof result!.monto).toBe('number');
    });

    it('should return null when not found', async () => {
      prisma.cita.findFirst.mockResolvedValue(null);

      const result = await repo.getByIdAndNegocio(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('checkOcupado', () => {
    it('should return true when slot is occupied', async () => {
      prisma.cita.findFirst.mockResolvedValue(buildCita(1));

      const result = await repo.checkOcupado(1, today(), '10:00');

      expect(prisma.cita.findFirst).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: today(),
          horario: '10:00',
          estado: { not: 'CANCELADA' },
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when slot is free', async () => {
      prisma.cita.findFirst.mockResolvedValue(null);

      const result = await repo.checkOcupado(1, today(), '10:00');

      expect(result).toBe(false);
    });

    it('should exclude given id when checking', async () => {
      prisma.cita.findFirst.mockResolvedValue(null);

      await repo.checkOcupado(1, today(), '10:00', 5);

      expect(prisma.cita.findFirst).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: today(),
          horario: '10:00',
          estado: { not: 'CANCELADA' },
          NOT: { id: 5 },
        },
      });
    });
  });

  describe('createIfSlotAvailable', () => {
    it('should create cita when slot is free', async () => {
      const created = buildCita(1, { estado: 'CONFIRMADA' });
      prisma.$transaction.mockImplementation(
        <T>(fn: (tx: ReturnType<typeof createMockPrisma>) => Promise<T>): Promise<T> => {
          const tx = createMockPrisma();
          tx.cita.findFirst.mockResolvedValue(null);
          tx.cita.create.mockResolvedValue(created);
          return fn(tx);
        },
      );

      const result = await repo.createIfSlotAvailable(1, today(), '10:00', {
        clienteNombre: 'Juan',
        clienteTelefono: '+521234567890',
        servicio: 'Corte',
        duracionMinutos: 60,
        monto: 250,
        estado: 'CONFIRMADA',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(typeof result!.monto).toBe('number');
    });

    it('should return null when slot is occupied', async () => {
      prisma.$transaction.mockImplementation(
        <T>(fn: (tx: ReturnType<typeof createMockPrisma>) => Promise<T>): Promise<T> => {
          const tx = createMockPrisma();
          tx.cita.findFirst.mockResolvedValue(buildCita(1));
          return fn(tx);
        },
      );

      const result = await repo.createIfSlotAvailable(1, today(), '10:00', {
        clienteNombre: 'Juan',
        clienteTelefono: '+521234567890',
        servicio: 'Corte',
        duracionMinutos: 60,
        monto: 250,
        estado: 'CONFIRMADA',
      });

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the cita', async () => {
      const updated = buildCita(1, { estado: 'CONFIRMADA' });
      prisma.cita.update.mockResolvedValue(updated);

      const result = await repo.update(1, { estado: 'CONFIRMADA' });

      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'CONFIRMADA' },
      });
      expect(result.id).toBe(updated.id);
      expect(typeof result.monto).toBe('number');
    });
  });

  describe('reprogramarIfSlotAvailable', () => {
    it('should reprogram cita when new slot is free', async () => {
      const nuevaFecha = daysFromNow(2);
      const updated = buildCita(1, { fecha: nuevaFecha, horario: '14:00' });
      prisma.$transaction.mockImplementation(
        <T>(fn: (tx: ReturnType<typeof createMockPrisma>) => Promise<T>): Promise<T> => {
          const tx = createMockPrisma();
          tx.cita.findFirst.mockResolvedValue(null);
          tx.cita.update.mockResolvedValue(updated);
          return fn(tx);
        },
      );

      const result = await repo.reprogramarIfSlotAvailable(1, 1, nuevaFecha, '14:00');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(updated.id);
      expect(typeof result!.monto).toBe('number');
    });

    it('should return null when new slot is occupied', async () => {
      prisma.$transaction.mockImplementation(
        <T>(fn: (tx: ReturnType<typeof createMockPrisma>) => Promise<T>): Promise<T> => {
          const tx = createMockPrisma();
          tx.cita.findFirst.mockResolvedValue(buildCita(1));
          return fn(tx);
        },
      );

      const result = await repo.reprogramarIfSlotAvailable(1, 1, daysFromNow(2), '14:00');

      expect(result).toBeNull();
    });
  });

  describe('getSumaIngresosHoy', () => {
    it('should return sum of confirmed citas', async () => {
      prisma.cita.aggregate.mockResolvedValue({ _sum: { monto: 500 } });

      const result = await repo.getSumaIngresosHoy(1, today(), daysFromNow(1));

      expect(prisma.cita.aggregate).toHaveBeenCalledWith({
        _sum: { monto: true },
        where: {
          negocioId: 1,
          fecha: { gte: today(), lte: daysFromNow(1) },
          estado: 'CONFIRMADA',
        },
      });
      expect(result).toBe(500);
    });

    it('should return 0 when no ingresos', async () => {
      prisma.cita.aggregate.mockResolvedValue({ _sum: { monto: null } });

      const result = await repo.getSumaIngresosHoy(1, today(), daysFromNow(1));

      expect(result).toBe(0);
    });
  });

  describe('findRecurringSeries', () => {
    it('should return citas matching recurrenceId', async () => {
      const citas = [
        buildCita(1, { recurrenceId: 'abc-123', fecha: daysFromNow(1) }),
        buildCita(1, { recurrenceId: 'abc-123', fecha: daysFromNow(8) }),
      ];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.findRecurringSeries('abc-123', 1);

      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: { recurrenceId: 'abc-123', negocioId: 1 },
        orderBy: { fecha: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(typeof result[0].monto).toBe('number');
    });

    it('should return empty array when series not found', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.findRecurringSeries('nonexistent', 1);

      expect(result).toHaveLength(0);
    });
  });

  describe('createRecurringInstances', () => {
    it('should create multiple instances and return count', async () => {
      prisma.cita.createMany.mockResolvedValue({ count: 3 });

      const instances = [
        {
          fecha: daysFromNow(1),
          horario: '10:00',
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicio: 'Corte',
          duracionMinutos: 60,
          monto: 250,
          estado: 'PENDIENTE',
          recurrenceId: 'abc-123',
        },
        {
          fecha: daysFromNow(8),
          horario: '10:00',
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          servicio: 'Corte',
          duracionMinutos: 60,
          monto: 250,
          estado: 'PENDIENTE',
          recurrenceId: 'abc-123',
        },
      ];

      const result = await repo.createRecurringInstances(instances, 1);

      expect(prisma.cita.createMany).toHaveBeenCalledWith({
        data: instances.map((inst) => ({ ...inst, negocioId: 1 })),
      });
      expect(result).toBe(3);
    });
  });

  describe('cancelRecurringSeries', () => {
    it('should cancel future non-canceled citas in series', async () => {
      prisma.cita.updateMany.mockResolvedValue({ count: 2 });

      const result = await repo.cancelRecurringSeries('abc-123', 1);

      expect(prisma.cita.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recurrenceId: 'abc-123',
            negocioId: 1,
            estado: { notIn: ['CANCELADA'] },
          }),
          data: { estado: 'CANCELADA' },
        }),
      );
      expect(result).toBe(2);
    });
  });

  describe('updateLastAppointmentRating', () => {
    it('should update rating when cita is found', async () => {
      const cita = buildCita(1, { encuestaEnviada: true, rating: null });
      prisma.cita.findFirst.mockResolvedValue(cita);

      const result = await repo.updateLastAppointmentRating(1, '+521234567890', 5);

      expect(prisma.cita.findFirst).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          clienteTelefono: '+521234567890',
          encuestaEnviada: true,
          rating: null,
        },
        orderBy: { fecha: 'desc' },
      });
      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: cita.id },
        data: { rating: 5 },
      });
      expect(result).toBe(true);
    });

    it('should return false when no matching cita', async () => {
      prisma.cita.findFirst.mockResolvedValue(null);

      const result = await repo.updateLastAppointmentRating(1, '+521234567890', 5);

      expect(result).toBe(false);
    });
  });
});
