import { prisma } from '../repositories/prisma';
import type { HorarioEspecial } from '../domain/types';

export const horariosEspecialesRepository = {
  async findByNegocioId(negocioId: number): Promise<HorarioEspecial[]> {
    const records = await prisma.horarioEspecial.findMany({
      where: { negocioId },
      orderBy: { fecha: 'asc' },
    });
    return records as unknown as HorarioEspecial[];
  },

  async findByNegocioIdYFecha(negocioId: number, fecha: Date): Promise<HorarioEspecial | null> {
    const record = await prisma.horarioEspecial.findFirst({
      where: { negocioId, fecha },
    });
    return record as unknown as HorarioEspecial | null;
  },

  async findByNegocioIdRange(
    negocioId: number,
    desde: Date,
    hasta: Date,
  ): Promise<HorarioEspecial[]> {
    const records = await prisma.horarioEspecial.findMany({
      where: {
        negocioId,
        fecha: {
          gte: desde,
          lte: hasta,
        },
      },
      orderBy: { fecha: 'asc' },
    });
    return records as unknown as HorarioEspecial[];
  },

  async create(data: {
    negocioId: number;
    fecha: Date;
    cerrado: boolean;
    horaInicio?: string;
    horaFin?: string;
  }): Promise<HorarioEspecial> {
    const record = await prisma.horarioEspecial.create({
      data: {
        ...data,
      },
    });
    return record as unknown as HorarioEspecial;
  },

  async deleteById(id: number): Promise<HorarioEspecial> {
    const record = await prisma.horarioEspecial.delete({
      where: { id },
    });
    return record as unknown as HorarioEspecial;
  },
};
