import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Servicio, HorarioEspecial, HorarioNegocio, HorarioStaff } from '../domain/types';

interface CitaParaDisponibilidad {
  horario: string;
  duracionMinutos: number;
}

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findServicio(servicioId: number, negocioId: number): Promise<Servicio | null> {
    const record = await this.prisma.servicio.findFirst({
      where: { id: servicioId, negocioId, activo: true },
    });
    return record;
  }

  async findPrimerServicioActivo(negocioId: number): Promise<Servicio | null> {
    const record = await this.prisma.servicio.findFirst({
      where: { negocioId, activo: true },
      orderBy: { id: 'asc' },
    });
    return record;
  }

  async findHorarioEspecial(negocioId: number, fecha: Date): Promise<HorarioEspecial | null> {
    const record = await this.prisma.horarioEspecial.findFirst({
      where: { negocioId, fecha },
    });
    return record;
  }

  async findHorariosNegocio(negocioId: number, diaSemana: number): Promise<HorarioNegocio[]> {
    const records = await this.prisma.horarioNegocio.findMany({
      where: { negocioId, diaSemana, activo: true },
    });
    return records;
  }

  async findHorarioStaff(usuarioId: number, diaSemana: number): Promise<HorarioStaff | null> {
    const record = await this.prisma.horarioStaff.findFirst({
      where: { usuarioId, diaSemana, activo: true },
    });
    return record;
  }

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
    const records = await this.prisma.cita.findMany({
      where,
      select: { horario: true, duracionMinutos: true },
    });
    return records;
  }
}
