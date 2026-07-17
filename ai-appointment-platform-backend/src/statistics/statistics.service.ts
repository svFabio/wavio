import { Injectable } from '@nestjs/common';
import { StatisticsRepository } from './statistics.repository';
import { ValidationError } from '../domain/errors';

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticsRepository: StatisticsRepository) {}

  async getOverview(
    negocioId: number,
  ): Promise<{
    citasMes: number;
    ingresosMes: number;
    topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
    horariosPopulares: Array<{ horario: string; totalReservas: number }>;
    citasVirtuales: number;
    citasPresenciales: number;
    ratingPromedio: number;
    ultimosComentarios: Array<{
      clienteNombre: string | null;
      rating: number | null;
      comentario: string | null;
      fecha: Date;
    }>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      citasMes,
      citasConfirmadas,
      clientesAgrupados,
      horariosAgrupados,
      ratingPromedio,
      ultimosComentarios,
      citasVirtuales,
      citasPresenciales,
    ] = await Promise.all([
      this.statisticsRepository.countCitasMes(negocioId, startOfMonth, endOfMonth),
      this.statisticsRepository.getCitasConfirmadasMonto(negocioId, startOfMonth, endOfMonth),
      this.statisticsRepository.getTopClientes(negocioId),
      this.statisticsRepository.getHorariosPopulares(negocioId),
      this.statisticsRepository.getRatingPromedio(negocioId),
      this.statisticsRepository.getUltimosComentarios(negocioId),
      this.statisticsRepository.countCitasPorOrigen(
        negocioId,
        startOfMonth,
        endOfMonth,
        'virtual',
      ),
      this.statisticsRepository.countCitasPorOrigen(
        negocioId,
        startOfMonth,
        endOfMonth,
        'presencial',
      ),
    ]);

    const ingresosMes = citasConfirmadas.reduce((sum, cita) => sum + Number(cita.monto), 0);
    const topClientes = clientesAgrupados.map((c) => ({
      nombre: c.clienteNombre || 'Sin nombre',
      telefono: c.clienteTelefono,
      totalCitas: c.totalCitas,
    }));

    const horariosPopulares = horariosAgrupados.map((h) => ({
      horario: h.horario,
      totalReservas: h._count.id,
    }));

    return {
      citasMes,
      ingresosMes,
      topClientes,
      horariosPopulares,
      citasVirtuales,
      citasPresenciales,
      ratingPromedio,
      ultimosComentarios,
    };
  }

  async getRevenue(
    negocioId: number,
    months: number,
  ): Promise<{ revenue: Array<{ mes: string; total: number }> }> {
    if (!months || months < 1 || months > 120) {
      throw new ValidationError('Months debe ser un número entre 1 y 120');
    }
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const revenue = await this.statisticsRepository.getCitasIngresos(negocioId, startDate);

    return { revenue };
  }
}
