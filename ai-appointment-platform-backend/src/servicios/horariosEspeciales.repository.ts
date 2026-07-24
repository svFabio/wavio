import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { HorarioEspecial } from '../domain/types';

@Injectable()
export class HorariosEspecialesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNegocioId(negocioId: number): Promise<HorarioEspecial[]> {
    const records = await this.prisma.horarioEspecial.findMany({
      where: { negocioId },
      orderBy: { fecha: 'asc' },
    });
    return records;
  }

  async findByNegocioIdYFecha(negocioId: number, fecha: Date): Promise<HorarioEspecial | null> {
    const record = await this.prisma.horarioEspecial.findFirst({
      where: { negocioId, fecha },
    });
    return record;
  }

  async findByNegocioIdRange(
    negocioId: number,
    desde: Date,
    hasta: Date,
  ): Promise<HorarioEspecial[]> {
    const records = await this.prisma.horarioEspecial.findMany({
      where: {
        negocioId,
        fecha: {
          gte: desde,
          lte: hasta,
        },
      },
      orderBy: { fecha: 'asc' },
    });
    return records;
  }

  async create(data: {
    negocioId: number;
    fecha: Date;
    cerrado: boolean;
    horaInicio?: string;
    horaFin?: string;
  }): Promise<HorarioEspecial> {
    const record = await this.prisma.horarioEspecial.create({
      data: {
        ...data,
      },
    });
    return record;
  }

  async findById(id: number): Promise<HorarioEspecial | null> {
    const record = await this.prisma.horarioEspecial.findUnique({
      where: { id },
    });
    return record;
  }

  async deleteById(id: number): Promise<HorarioEspecial> {
    const record = await this.prisma.horarioEspecial.delete({
      where: { id },
    });
    return record;
  }
}
