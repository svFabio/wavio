import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppointmentRepository } from './appointment.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { resetIds } from '../__tests__/factories';
import type { PrismaService } from '../prisma/prisma.service';

describe('AppointmentRepository', () => {
  let prisma: MockPrisma;
  let repo: AppointmentRepository;
  const originalTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
    resetIds();
    prisma = createMockPrisma();
    repo = new AppointmentRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  describe('findUpcomingForReminder', () => {
    const desde = new Date('2026-07-28T12:00:00.000Z');
    const hasta = new Date('2026-07-28T14:00:00.000Z');

    it('should query CONFIRMADA citas within the day window', async () => {
      const citas = [
        {
          id: 1,
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          fecha: new Date('2026-07-28'),
          horario: '12:30',
          servicio: 'Corte',
          recordatorio24h: false,
          recordatorio1h: false,
          negocioId: 1,
        },
      ];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.findUpcomingForReminder(1, desde, hasta);

      expect(prisma.cita.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            negocioId: 1,
            estado: 'CONFIRMADA',
            fecha: {
              gte: new Date('2026-07-28T00:00:00.000Z'),
              lte: new Date('2026-07-28T23:59:59.999Z'),
            },
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array when no citas found', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.findUpcomingForReminder(1, desde, hasta);

      expect(result).toHaveLength(0);
    });
  });

  describe('markReminderSent', () => {
    it('should mark 24h reminder as sent', async () => {
      prisma.cita.update.mockResolvedValue({} as never);

      await repo.markReminderSent(1, '24h');

      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recordatorio24h: true },
      });
    });

    it('should mark 1h reminder as sent', async () => {
      prisma.cita.update.mockResolvedValue({} as never);

      await repo.markReminderSent(1, '1h');

      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { recordatorio1h: true },
      });
    });
  });

  describe('findCompletedForSurvey', () => {
    const cutoff = new Date('2026-07-28T12:00:00.000Z');

    it('should query CONFIRMADA citas before the survey cutoff day', async () => {
      const citas = [
        {
          id: 1,
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          encuestaEnviada: false,
          negocioId: 1,
          fecha: new Date('2026-07-27'),
          horario: '09:00',
        },
      ];
      prisma.cita.findMany.mockResolvedValue(citas);

      const result = await repo.findCompletedForSurvey(1, cutoff);

      expect(prisma.cita.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            negocioId: 1,
            estado: 'CONFIRMADA',
            encuestaEnviada: false,
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no citas found', async () => {
      prisma.cita.findMany.mockResolvedValue([]);

      const result = await repo.findCompletedForSurvey(1, cutoff);

      expect(result).toHaveLength(0);
    });
  });

  describe('markSurveySent', () => {
    it('should mark survey as sent', async () => {
      prisma.cita.update.mockResolvedValue({} as never);

      await repo.markSurveySent(1);

      expect(prisma.cita.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { encuestaEnviada: true },
      });
    });
  });
});
