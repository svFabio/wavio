import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { Cita } from '../domain/types';

type CitaCountWhere = {
  estado?: string | { not: string } | { notIn: string[] };
  fecha?: { gte?: Date; lte?: Date } | { gte?: Date };
};

export const citasRepository = {
  async getPendientes(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{ data: Cita[]; total: number; page: number; limit: number }> {
    const where = { negocioId, estado: 'VALIDACION_PENDIENTE' as const };
    const [data, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cita.count({ where }),
    ]);
    return { data: data as unknown as Cita[], total, page, limit };
  },

  async getAgenda(
    negocioId: number,
    fechaDesde: Date,
    fechaHasta: Date,
    page: number,
    limit: number,
  ): Promise<{ data: Cita[]; total: number; page: number; limit: number }> {
    const where = {
      negocioId,
      fecha: { gte: fechaDesde, lte: fechaHasta },
      estado: { not: 'CANCELADA' },
    };
    const [data, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        orderBy: { fecha: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cita.count({ where }),
    ]);
    return { data: data as unknown as Cita[], total, page, limit };
  },

  async getCitasCount(negocioId: number, query: CitaCountWhere): Promise<number> {
    return prisma.cita.count({ where: { negocioId, ...query } });
  },

  async getProximasCitas(
    negocioId: number,
    inicio: Date,
    fin: Date,
    take: number,
  ): Promise<Cita[]> {
    const citas = await prisma.cita.findMany({
      where: { negocioId, fecha: { gte: inicio, lte: fin }, estado: { not: 'CANCELADA' } },
      orderBy: { horario: 'asc' },
      take,
    });
    return citas as unknown as Cita[];
  },

  async getOcupadas(negocioId: number, inicio: Date, fin: Date): Promise<{ horario: string }[]> {
    return prisma.cita.findMany({
      where: { negocioId, fecha: { gte: inicio, lte: fin }, estado: { notIn: ['CANCELADA'] } },
      select: { horario: true },
    });
  },

  async getByIdAndNegocio(id: number, negocioId: number): Promise<Cita | null> {
    const cita = await prisma.cita.findFirst({ where: { id, negocioId } });
    return cita as unknown as Cita;
  },

  async checkOcupado(
    negocioId: number,
    fecha: Date,
    horario: string,
    excludeId?: number,
  ): Promise<boolean> {
    const where: Prisma.CitaWhereInput = {
      negocioId,
      fecha,
      horario,
      estado: { not: 'CANCELADA' },
    };
    if (excludeId) where.NOT = { id: excludeId };
    const cita = await prisma.cita.findFirst({ where });
    return !!cita;
  },

  async createIfSlotAvailable(
    negocioId: number,
    fecha: Date,
    horario: string,
    data: Omit<Prisma.CitaUncheckedCreateInput, 'negocioId' | 'fecha' | 'horario'>,
  ): Promise<Cita> {
    return prisma.$transaction(async (tx) => {
      const occupied = await tx.cita.findFirst({
        where: { negocioId, fecha, horario, estado: { not: 'CANCELADA' } },
      });
      if (occupied) {
        throw new Error('SLOT_OCCUPIED');
      }
      const cita = await tx.cita.create({
        data: { ...data, negocioId, fecha, horario },
      });
      return cita as unknown as Cita;
    });
  },

  async update(
    id: number,
    data: Partial<Omit<Cita, 'id' | 'creadoEn' | 'negocioId'>>,
  ): Promise<Cita> {
    const cita = await prisma.cita.update({ where: { id }, data });
    return cita as unknown as Cita;
  },

  async reprogramarIfSlotAvailable(
    id: number,
    negocioId: number,
    fecha: Date,
    horario: string,
  ): Promise<Cita | null> {
    return prisma.$transaction(async (tx) => {
      const occupied = await tx.cita.findFirst({
        where: { negocioId, fecha, horario, estado: { not: 'CANCELADA' }, NOT: { id } },
      });
      if (occupied) return null;
      return tx.cita.update({ where: { id }, data: { fecha, horario } }) as unknown as Cita;
    });
  },
};
