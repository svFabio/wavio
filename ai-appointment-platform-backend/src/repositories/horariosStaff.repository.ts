import { prisma } from './prisma';
import type { HorarioStaff } from '../domain/types';

export const horariosStaffRepository = {
  async findByUsuarioId(usuarioId: number): Promise<HorarioStaff[]> {
    const records = await prisma.horarioStaff.findMany({
      where: { usuarioId, activo: true },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
    return records as unknown as HorarioStaff[];
  },

  async findByUsuarioIdYDia(usuarioId: number, diaSemana: number): Promise<HorarioStaff[]> {
    const records = await prisma.horarioStaff.findMany({
      where: { usuarioId, diaSemana, activo: true },
      orderBy: { horaInicio: 'asc' },
    });
    return records as unknown as HorarioStaff[];
  },

  async upsert(
    usuarioId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
  ): Promise<HorarioStaff> {
    const record = await prisma.horarioStaff.upsert({
      where: {
        usuarioId_diaSemana_horaInicio: {
          usuarioId,
          diaSemana,
          horaInicio,
        },
      },
      update: {
        horaFin,
        activo: true,
      },
      create: {
        usuarioId,
        diaSemana,
        horaInicio,
        horaFin,
        activo: true,
      },
    });
    return record as unknown as HorarioStaff;
  },

  async deleteByUsuarioId(usuarioId: number): Promise<number> {
    const { count } = await prisma.horarioStaff.deleteMany({
      where: { usuarioId },
    });
    return count;
  },
};
