import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Servicio } from '../domain/types';

@Injectable()
export class ServiciosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNegocioId(negocioId: number): Promise<Servicio[]> {
    const records = await this.prisma.servicio.findMany({
      where: { negocioId, activo: true },
      orderBy: { nombre: 'asc' },
    });
    return records as unknown as Servicio[];
  }

  async findById(id: number): Promise<Servicio | null> {
    const record = await this.prisma.servicio.findUnique({
      where: { id },
    });
    return record as unknown as Servicio | null;
  }

  async create(data: {
    negocioId: number;
    nombre: string;
    duracionMinutos: number;
    bufferMinutos: number;
    precio: number;
  }): Promise<Servicio> {
    const record = await this.prisma.servicio.create({
      data: {
        ...data,
        activo: true,
      },
    });
    return record as unknown as Servicio;
  }

  async update(
    id: number,
    data: Partial<{
      nombre: string;
      duracionMinutos: number;
      bufferMinutos: number;
      precio: number;
      activo: boolean;
    }>,
  ): Promise<Servicio> {
    const record = await this.prisma.servicio.update({
      where: { id },
      data,
    });
    return record as unknown as Servicio;
  }

  async softDelete(id: number): Promise<Servicio> {
    const record = await this.prisma.servicio.update({
      where: { id },
      data: { activo: false },
    });
    return record as unknown as Servicio;
  }
}
