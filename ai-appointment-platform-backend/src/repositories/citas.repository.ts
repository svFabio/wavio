import { Prisma } from '@prisma/client';
import { prisma } from '../repositories/prisma';
import { Cita } from '../domain/types';

type CitaCountWhere = {
  estado?: string | { not: string } | { notIn: string[] };
  fecha?: { gte?: Date; lte?: Date } | { gte?: Date };
};

export const citasRepository = {
  async getPendientes(negocioId: number): Promise<Cita[]> {
    const citas = await prisma.cita.findMany({
      where: { negocioId, estado: 'VALIDACION_PENDIENTE' },
      orderBy: { creadoEn: 'desc' }
    });
    return citas as unknown as Cita[];
  },

  async getAgenda(negocioId: number, fechaDesde: Date, fechaHasta: Date): Promise<Cita[]> {
    const citas = await prisma.cita.findMany({
      where: {
        negocioId,
        fecha: { gte: fechaDesde, lte: fechaHasta },
        estado: { not: 'CANCELADA' }
      },
      orderBy: { fecha: 'asc' }
    });
    return citas as unknown as Cita[];
  },

  async getCitasCount(negocioId: number, query: CitaCountWhere): Promise<number> {
    return prisma.cita.count({ where: { negocioId, ...query } });
  },

  async getProximasCitas(negocioId: number, inicio: Date, fin: Date, take: number): Promise<Cita[]> {
    const citas = await prisma.cita.findMany({
      where: { negocioId, fecha: { gte: inicio, lte: fin }, estado: { not: 'CANCELADA' } },
      orderBy: { horario: 'asc' },
      take
    });
    return citas as unknown as Cita[];
  },

  async getOcupadas(negocioId: number, inicio: Date, fin: Date): Promise<{ horario: string }[]> {
    return prisma.cita.findMany({
      where: { negocioId, fecha: { gte: inicio, lte: fin }, estado: { notIn: ['CANCELADA'] } },
      select: { horario: true }
    });
  },

  async getByIdAndNegocio(id: number, negocioId: number): Promise<Cita | null> {
    const cita = await prisma.cita.findFirst({ where: { id, negocioId } });
    return cita as unknown as Cita;
  },

  async checkOcupado(negocioId: number, fecha: Date, horario: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.CitaWhereInput = { negocioId, fecha, horario, estado: { not: 'CANCELADA' } };
    if (excludeId) where.NOT = { id: excludeId };
    const cita = await prisma.cita.findFirst({ where });
    return !!cita;
  },

  async createIfSlotAvailable(
    negocioId: number,
    fecha: Date,
    horario: string,
    data: Omit<Prisma.CitaUncheckedCreateInput, 'negocioId' | 'fecha' | 'horario'>
  ): Promise<Cita> {
    return prisma.$transaction(async (tx) => {
      const occupied = await tx.cita.findFirst({
        where: { negocioId, fecha, horario, estado: { not: 'CANCELADA' } }
      });
      if (occupied) {
        throw new Error('SLOT_OCCUPIED');
      }
      const cita = await tx.cita.create({
        data: { ...data, negocioId, fecha, horario }
      });
      return cita as unknown as Cita;
    });
  },

  async create(data: Parameters<typeof prisma.cita.create>[0]['data']): Promise<Cita> {
    const cita = await prisma.cita.create({ data });
    return cita as unknown as Cita;
  },

  async update(id: number, data: Partial<Omit<Cita, 'id' | 'creadoEn' | 'negocioId'>>): Promise<Cita> {
    const cita = await prisma.cita.update({ where: { id }, data });
    return cita as unknown as Cita;
  },

  async createWithTransaction<T>(callback: (tx: { cita: typeof prisma.cita; sesionChat: typeof prisma.sesionChat }) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      return callback({ cita: tx.cita, sesionChat: tx.sesionChat });
    });
  }
};
