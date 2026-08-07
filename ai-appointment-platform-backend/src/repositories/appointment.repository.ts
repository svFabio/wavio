import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CitaCandidata = {
  id: number;
  clienteNombre: string | null;
  clienteTelefono: string;
  fecha: Date;
  horario: string;
  servicio: string;
  recordatorio24h: boolean;
  recordatorio1h: boolean;
  negocioId: number;
};

export type CitaEncuestaCandidata = {
  id: number;
  clienteNombre: string | null;
  clienteTelefono: string;
  encuestaEnviada: boolean;
  negocioId: number;
  fecha: Date;
  horario: string;
};

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch CONFIRMADA citas whose day falls within [desde, hasta].
   * Window boundaries are pre-computed by the caller; exact appointment
   * datetime matching happens in the domain layer.
   */
  async findUpcomingForReminder(
    negocioId: number,
    desde: Date,
    hasta: Date,
  ): Promise<CitaCandidata[]> {
    const fechaMin = new Date(desde);
    fechaMin.setHours(0, 0, 0, 0);
    const fechaMax = new Date(hasta);
    fechaMax.setHours(23, 59, 59, 999);

    return this.prisma.cita.findMany({
      where: {
        negocioId,
        estado: 'CONFIRMADA',
        fecha: { gte: fechaMin, lte: fechaMax },
      },
      select: {
        id: true,
        clienteNombre: true,
        clienteTelefono: true,
        fecha: true,
        horario: true,
        servicio: true,
        recordatorio24h: true,
        recordatorio1h: true,
        negocioId: true,
      },
    });
  }

  async markReminderSent(citaId: number, tipo: '24h' | '1h'): Promise<void> {
    const field = tipo === '24h' ? 'recordatorio24h' : 'recordatorio1h';
    await this.prisma.cita.update({
      where: { id: citaId },
      data: { [field]: true },
    });
  }

  /**
   * Fetch CONFIRMADA citas from days up to the survey cutoff.
   * Exact cutoff matching happens in the domain layer.
   */
  async findCompletedForSurvey(negocioId: number, cutoff: Date): Promise<CitaEncuestaCandidata[]> {
    const fechaMin = new Date(cutoff);
    fechaMin.setHours(0, 0, 0, 0);

    return this.prisma.cita.findMany({
      where: {
        negocioId,
        estado: 'CONFIRMADA',
        encuestaEnviada: false,
        fecha: { lt: new Date(cutoff.getTime() + 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        clienteNombre: true,
        clienteTelefono: true,
        encuestaEnviada: true,
        negocioId: true,
        fecha: true,
        horario: true,
      },
    });
  }

  async markSurveySent(citaId: number): Promise<void> {
    await this.prisma.cita.update({
      where: { id: citaId },
      data: { encuestaEnviada: true },
    });
  }
}
