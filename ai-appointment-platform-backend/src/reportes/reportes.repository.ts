import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Cita } from '../domain/types';

@Injectable()
export class ReportesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCitasByDateRange(negocioId: number, desde: Date, hasta: Date): Promise<Cita[]> {
    const rows = await this.prisma.cita.findMany({
      where: {
        negocioId,
        fecha: { gte: desde, lte: hasta },
      },
      orderBy: { fecha: 'asc' },
      take: 10000,
    });
    return rows.map((r) => ({ ...r, monto: Number(r.monto) })) as unknown as Cita[];
  }
}
