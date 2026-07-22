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
    categoria?: string;
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
      categoria: string;
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

  async findByCategoria(
    negocioId: number,
    categoria: string,
  ): Promise<Servicio[]> {
    const records = await this.prisma.servicio.findMany({
      where: { negocioId, activo: true, categoria },
      orderBy: { nombre: 'asc' },
    });
    return records as unknown as Servicio[];
  }

  async getCategorias(
    negocioId: number,
  ): Promise<Array<{ categoria: string; count: number }>> {
    const results = await this.prisma.servicio.groupBy({
      by: ['categoria'],
      where: { negocioId, activo: true },
      _count: { id: true },
      orderBy: { categoria: 'asc' },
    });
    return results.map((r) => ({
      categoria: r.categoria ?? 'Sin categoría',
      count: r._count.id,
    }));
  }

  async findAllByCategoria(
    negocioId: number,
  ): Promise<
    Array<{
      categoria: string;
      servicios: Servicio[];
    }>
  > {
    const servicios = await this.findByNegocioId(negocioId);
    const grouped = new Map<string, Servicio[]>();

    for (const servicio of servicios) {
      const cat = (servicio as unknown as { categoria?: string }).categoria ?? 'Sin categoría';
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(servicio);
    }

    return Array.from(grouped.entries()).map(([categoria, servicios]) => ({
      categoria,
      servicios,
    }));
  }
}
