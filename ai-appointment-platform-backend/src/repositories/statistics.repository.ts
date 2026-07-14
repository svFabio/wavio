import { Prisma } from '@prisma/client';
import { prisma } from '../repositories/prisma';

export const statisticsRepository = {
  async countCitasMes(negocioId: number, startOfMonth: Date, endOfMonth: Date): Promise<number> {
    return prisma.cita.count({
      where: {
        negocioId,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        estado: { not: 'CANCELADA' },
      },
    });
  },

  async getCitasConfirmadasMonto(
    negocioId: number,
    startOfMonth: Date,
    endOfMonth: Date,
  ): Promise<{ monto: Prisma.Decimal }[]> {
    return prisma.cita.findMany({
      where: { negocioId, fecha: { gte: startOfMonth, lte: endOfMonth }, estado: 'CONFIRMADA' },
      select: { monto: true },
    });
  },

  async getTopClientes(
    negocioId: number,
  ): Promise<{ clienteTelefono: string; clienteNombre: string | null; totalCitas: number }[]> {
    return prisma.$queryRaw<
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
  },

  async getHorariosPopulares(
    negocioId: number,
  ): Promise<{ horario: string; _count: { id: number } }[]> {
    const result = await prisma.cita.groupBy({
      by: ['horario'],
      _count: { id: true },
      where: { negocioId, estado: { not: 'CANCELADA' } },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    return result;
  },

  async getRatingPromedio(negocioId: number): Promise<number> {
    const ratingAgregado = await prisma.cita.aggregate({
      _avg: { rating: true },
      where: { negocioId, rating: { not: null } },
    });
    return ratingAgregado._avg.rating || 0;
  },

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
    return prisma.cita.findMany({
      where: { negocioId, comentario: { not: null }, estado: { not: 'CANCELADA' } },
      orderBy: { fecha: 'desc' },
      take: 5,
      select: { clienteNombre: true, rating: true, comentario: true, fecha: true },
    });
  },

  async countCitasPorOrigen(
    negocioId: number,
    startOfMonth: Date,
    endOfMonth: Date,
    origen: string,
  ): Promise<number> {
    return prisma.cita.count({
      where: {
        negocioId,
        fecha: { gte: startOfMonth, lte: endOfMonth },
        estado: { not: 'CANCELADA' },
        origen,
      },
    });
  },

  async getCitasIngresos(
    negocioId: number,
    startDate: Date,
  ): Promise<{ fecha: Date; monto: Prisma.Decimal }[]> {
    return prisma.cita.findMany({
      where: { negocioId, fecha: { gte: startDate }, estado: 'CONFIRMADA' },
      select: { fecha: true, monto: true },
    });
  },
};
