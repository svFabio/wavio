import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countCitasMes(
    negocioId: number,
    startOfMonth: Date,
    endOfMonth: Date,
  ): Promise<number> {
    return this.prisma.cita.count({
      where: {
        negocioId,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        estado: { not: 'CANCELADA' },
      },
    });
  }

  async getCitasConfirmadasMonto(
    negocioId: number,
    startOfMonth: Date,
    endOfMonth: Date,
  ): Promise<{ monto: Prisma.Decimal }[]> {
    return this.prisma.cita.findMany({
      where: {
        negocioId,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        estado: 'CONFIRMADA',
      },
      select: { monto: true },
    });
  }

  async getTopClientes(
    negocioId: number,
  ): Promise<{ clienteTelefono: string; clienteNombre: string | null; totalCitas: number }[]> {
    return this.prisma.$queryRaw<
      { clienteTelefono: string; clienteNombre: string | null; totalCitas: number }[]
    >`
      SELECT
        c."clienteTelefono",
        (SELECT c2."clienteNombre" FROM "Cita" c2
         WHERE c2."clienteTelefono" = c."clienteTelefono" AND c2."negocioId" = ${negocioId}
         ORDER BY c2."creadoEn" DESC LIMIT 1) as "clienteNombre",
        COUNT(*)::int as "totalCitas"
      FROM "Cita" c
      WHERE c."negocioId" = ${negocioId} AND c."estado" != 'CANCELADA'
      GROUP BY c."clienteTelefono"
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;
  }

  async getHorariosPopulares(
    negocioId: number,
  ): Promise<{ horario: string; _count: { id: number } }[]> {
    const result = await this.prisma.cita.groupBy({
      by: ['horario'],
      _count: { id: true },
      where: { negocioId, estado: { not: 'CANCELADA' } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    return result as { horario: string; _count: { id: number } }[];
  }

  async getRatingPromedio(negocioId: number): Promise<number> {
    const ratingAgregado = await this.prisma.cita.aggregate({
      _avg: { rating: true },
      where: { negocioId, rating: { not: null } },
    });
    return ratingAgregado._avg.rating || 0;
  }

  async getUltimosComentarios(
    negocioId: number,
  ): Promise<
    {
      clienteNombre: string | null;
      rating: number | null;
      comentario: string | null;
      fecha: Date;
    }[]
  > {
    return this.prisma.cita.findMany({
      where: { negocioId, comentario: { not: null }, estado: { not: 'CANCELADA' } },
      orderBy: { fecha: 'desc' },
      take: 5,
      select: { clienteNombre: true, rating: true, comentario: true, fecha: true },
    });
  }

  async countCitasPorOrigen(
    negocioId: number,
    startOfMonth: Date,
    endOfMonth: Date,
    origen: string,
  ): Promise<number> {
    return this.prisma.cita.count({
      where: {
        negocioId,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        estado: { not: 'CANCELADA' },
        origen,
      },
    });
  }

  async getCitasIngresos(
    negocioId: number,
    startDate: Date,
  ): Promise<{ mes: string; total: number }[]> {
    return this.prisma.$queryRaw<{ mes: string; total: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') AS mes,
        COALESCE(SUM(monto), 0)::float                 AS total
      FROM "Cita"
      WHERE
        "negocioId" = ${negocioId}
        AND fecha >= ${startDate}
        AND estado = 'CONFIRMADA'
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY DATE_TRUNC('month', fecha)
    `;
  }
}
