import { prisma } from '../repositories/prisma';
import type { HorarioNegocio } from '../domain/types';

export const horariosNegocioRepository = {
  async findByNegocioId(negocioId: number): Promise<HorarioNegocio[]> {
    const records = await prisma.horarioNegocio.findMany({
      where: { negocioId, activo: true },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
    return records as unknown as HorarioNegocio[];
  },

  async findByNegocioIdYDia(negocioId: number, diaSemana: number): Promise<HorarioNegocio[]> {
    const records = await prisma.horarioNegocio.findMany({
      where: { negocioId, diaSemana, activo: true },
      orderBy: { horaInicio: 'asc' },
    });
    return records as unknown as HorarioNegocio[];
  },

  async upsert(
    negocioId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
  ): Promise<HorarioNegocio> {
    const record = await prisma.horarioNegocio.upsert({
      where: {
        negocioId_diaSemana_horaInicio: {
          negocioId,
          diaSemana,
          horaInicio,
        },
      },
      update: {
        horaFin,
        activo: true,
      },
      create: {
        negocioId,
        diaSemana,
        horaInicio,
        horaFin,
        activo: true,
      },
    });
    return record as unknown as HorarioNegocio;
  },

  async deleteByNegocioId(negocioId: number): Promise<number> {
    const { count } = await prisma.horarioNegocio.deleteMany({
      where: { negocioId },
    });
    return count;
  },

  async deleteByNegocioIdYDia(negocioId: number, diaSemana: number): Promise<number> {
    const { count } = await prisma.horarioNegocio.deleteMany({
      where: { negocioId, diaSemana },
    });
    return count;
  },
};
