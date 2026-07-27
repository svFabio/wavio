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
    return record ? { ...record, precio: Number(record.precio) } : null;
  }

  async findPrimerServicioActivo(negocioId: number): Promise<Servicio | null> {
    const record = await this.prisma.servicio.findFirst({
      where: { negocioId, activo: true },
      orderBy: { id: 'asc' },
    });
    return record ? { ...record, precio: Number(record.precio) } : null;
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

  async findCitasForRange(
    negocioId: number,
    fechaInicio: Date,
    fechaFin: Date,
    staffId?: number,
  ): Promise<Array<{ fecha: Date; horario: string; duracionMinutos: number }>> {
    const where: Record<string, unknown> = {
      negocioId,
      fecha: { gte: fechaInicio, lte: fechaFin },
      estado: { notIn: ['CANCELADA'] },
    };
    if (staffId) {
      where.staffId = staffId;
    }
    return this.prisma.cita.findMany({
      where,
      select: { fecha: true, horario: true, duracionMinutos: true },
    });
  }

  async findHorariosNegocioAll(negocioId: number): Promise<HorarioNegocio[]> {
    return this.prisma.horarioNegocio.findMany({
      where: { negocioId, activo: true },
    });
  }

  async findHorariosEspecialesInRange(
    negocioId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<HorarioEspecial[]> {
    return this.prisma.horarioEspecial.findMany({
      where: {
        negocioId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
    });
  }

  async findHorarioStaffAll(usuarioId: number): Promise<HorarioStaff[]> {
    return this.prisma.horarioStaff.findMany({
      where: { usuarioId, activo: true },
    });
  }
}
