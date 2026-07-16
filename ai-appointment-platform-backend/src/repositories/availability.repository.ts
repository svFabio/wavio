import { prisma } from './prisma';
import type { Servicio, HorarioEspecial, HorarioNegocio, HorarioStaff } from '../domain/types';

interface CitaParaDisponibilidad {
  horario: string;
  duracionMinutos: number;
}

export const availabilityRepository = {
  async findServicio(servicioId: number, negocioId: number): Promise<Servicio | null> {
    const record = await prisma.servicio.findFirst({
      where: { id: servicioId, negocioId, activo: true },
    });
    return record as unknown as Servicio | null;
  },

  async findPrimerServicioActivo(negocioId: number): Promise<Servicio | null> {
    const record = await prisma.servicio.findFirst({
      where: { negocioId, activo: true },
      orderBy: { id: 'asc' },
    });
    return record as unknown as Servicio | null;
  },

  async findHorarioEspecial(negocioId: number, fecha: Date): Promise<HorarioEspecial | null> {
    const record = await prisma.horarioEspecial.findFirst({
      where: { negocioId, fecha },
    });
    return record as unknown as HorarioEspecial | null;
  },

  async findHorariosNegocio(negocioId: number, diaSemana: number): Promise<HorarioNegocio[]> {
    const records = await prisma.horarioNegocio.findMany({
      where: { negocioId, diaSemana, activo: true },
    });
    return records as unknown as HorarioNegocio[];
  },

  async findHorarioStaff(usuarioId: number, diaSemana: number): Promise<HorarioStaff | null> {
    const record = await prisma.horarioStaff.findFirst({
      where: { usuarioId, diaSemana, activo: true },
    });
    return record as unknown as HorarioStaff | null;
  },

  async findCitasDelDia(
    negocioId: number,
    inicioDia: Date,
    finDia: Date,
    staffId?: number,
  ): Promise<CitaParaDisponibilidad[]> {
    const where: Record<string, unknown> = {
      negocioId,
      fecha: { gte: inicioDia, lte: finDia },
      estado: { notIn: ['CANCELADA'] },
    };
    if (staffId) {
      where.staffId = staffId;
    }
    const records = await prisma.cita.findMany({
      where,
      select: { horario: true, duracionMinutos: true },
    });
    return records as unknown as CitaParaDisponibilidad[];
  },
};
