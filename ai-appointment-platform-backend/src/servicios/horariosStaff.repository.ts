import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { HorarioStaff } from '../domain/types';

@Injectable()
export class HorariosStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsuarioId(usuarioId: number): Promise<HorarioStaff[]> {
    const records = await this.prisma.horarioStaff.findMany({
      where: { usuarioId, activo: true },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
    return records;
  }

  async findByUsuarioIdYDia(usuarioId: number, diaSemana: number): Promise<HorarioStaff[]> {
    const records = await this.prisma.horarioStaff.findMany({
      where: { usuarioId, diaSemana, activo: true },
      orderBy: { horaInicio: 'asc' },
    });
    return records;
  }

  async findByNegocioId(negocioId: number): Promise<
    Array<{
      usuarioId: number;
      diaSemana: number;
      horaInicio: string;
      horaFin: string;
    }>
  > {
    return this.prisma.horarioStaff.findMany({
      where: {
        usuario: { usuarioNegocios: { some: { negocioId } } },
        activo: true,
      },
      select: {
        usuarioId: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
      },
      orderBy: [{ usuarioId: 'asc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async upsert(
    usuarioId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
  ): Promise<HorarioStaff> {
    const record = await this.prisma.horarioStaff.upsert({
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
    return record;
  }

  async deleteByUsuarioId(usuarioId: number): Promise<number> {
    const { count } = await this.prisma.horarioStaff.deleteMany({
      where: { usuarioId },
    });
    return count;
  }

  async getAvailableStaffForSlot(
    negocioId: number,
    diaSemana: number,
    horaInicio: string,
  ): Promise<number[]> {
    const staff = await this.prisma.horarioStaff.findMany({
      where: {
        usuario: { usuarioNegocios: { some: { negocioId } } },
        diaSemana,
        activo: true,
        horaInicio: { lte: horaInicio },
        horaFin: { gt: horaInicio },
      },
      select: { usuarioId: true },
    });
    return staff.map((s) => s.usuarioId);
  }
}
