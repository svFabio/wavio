import { Injectable, Logger } from '@nestjs/common';
import { CitasRepository } from '../repositories/citas.repository';
import type { Cita } from '../domain/types';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(private readonly citasRepository: CitasRepository) {}

  async exportCitasCSV(negocioId: number, fechaDesde: string, fechaHasta: string): Promise<string> {
    const desde = new Date(fechaDesde);
    const hasta = new Date(fechaHasta);

    const { data: citas } = await this.citasRepository.getAgenda(negocioId, desde, hasta, 1, 10000);

    const sanitizeCsvCell = (value: string): string => {
      if (/^[=+\-@\t\r]/.test(value)) {
        return `'${value}`;
      }
      return value;
    };

    const headers = [
      'ID',
      'Fecha',
      'Horario',
      'Cliente',
      'Teléfono',
      'Servicio',
      'Estado',
      'Monto',
      'Origen',
      'Staff ID',
      'Creado',
    ];

    const rows = citas.map((cita: Cita) => [
      String(cita.id),
      sanitizeCsvCell(new Date(cita.fecha).toISOString().split('T')[0]),
      sanitizeCsvCell(cita.horario),
      sanitizeCsvCell(cita.clienteNombre ?? ''),
      sanitizeCsvCell(cita.clienteTelefono),
      sanitizeCsvCell(cita.servicio),
      sanitizeCsvCell(cita.estado),
      String(cita.monto),
      sanitizeCsvCell(cita.origen),
      String(cita.staffId ?? ''),
      sanitizeCsvCell(new Date(cita.creadoEn).toISOString()),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    this.logger.log(`Exported ${citas.length} citas to CSV`);
    return csv;
  }

  async getResumenMensual(
    negocioId: number,
    year: number,
    month: number,
  ): Promise<{
    totalCitas: number;
    confirmadas: number;
    canceladas: number;
    noShows: number;
    ingresos: number;
    servicios: Array<{ servicio: string; count: number; ingresos: number }>;
  }> {
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 0, 23, 59, 59, 999);

    const { data: citas } = await this.citasRepository.getAgenda(negocioId, inicio, fin, 1, 10000);

    const totalCitas = citas.length;
    const confirmadas = citas.filter((c: Cita) => c.estado === 'CONFIRMADA').length;
    const canceladas = citas.filter((c: Cita) => c.estado === 'CANCELADA').length;
    const noShows = citas.filter((c: Cita) => c.estado === 'NO_ASISTIO').length;
    const ingresos = citas
      .filter((c: Cita) => c.estado === 'CONFIRMADA')
      .reduce((sum: number, c: Cita) => sum + Number(c.monto), 0);

    // Group by service
    const servicioMap = new Map<string, { count: number; ingresos: number }>();
    for (const cita of citas) {
      const existing = servicioMap.get(cita.servicio) ?? { count: 0, ingresos: 0 };
      existing.count++;
      if (cita.estado === 'CONFIRMADA') {
        existing.ingresos += Number(cita.monto);
      }
      servicioMap.set(cita.servicio, existing);
    }

    const servicios = Array.from(servicioMap.entries()).map(([servicio, data]) => ({
      servicio,
      ...data,
    }));

    return {
      totalCitas,
      confirmadas,
      canceladas,
      noShows,
      ingresos,
      servicios,
    };
  }
}
