import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUpcomingForReminder(
    negocioId: number,
    horasMinimas: number,
    horasMaximas: number,
  ): Promise<
    Array<{
      id: number;
      clienteNombre: string | null;
      clienteTelefono: string;
      fecha: Date;
      horario: string;
      servicio: string;
      recordatorio24h: boolean;
      recordatorio1h: boolean;
      negocioId: number;
    }>
  > {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() + horasMinimas * 60 * 60 * 1000);
    const hasta = new Date(ahora.getTime() + horasMaximas * 60 * 60 * 1000);

    return this.prisma.cita.findMany({
      where: {
        negocioId,
        estado: 'CONFIRMADA',
        fecha: { gte: desde, lte: hasta },
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

  async findCompletedForSurvey(
    negocioId: number,
    horasAtras: number,
  ): Promise<
    Array<{
      id: number;
      clienteNombre: string | null;
      clienteTelefono: string;
      encuestaEnviada: boolean;
      negocioId: number;
    }>
  > {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() - horasAtras * 60 * 60 * 1000);

    return this.prisma.cita.findMany({
      where: {
        negocioId,
        estado: 'CONFIRMADA',
        encuestaEnviada: false,
        fecha: { lt: desde },
      },
      select: {
        id: true,
        clienteNombre: true,
        clienteTelefono: true,
        encuestaEnviada: true,
        negocioId: true,
      },
    });
  }

  async markSurveySent(citaId: number): Promise<void> {
    await this.prisma.cita.update({
      where: { id: citaId },
      data: { encuestaEnviada: true },
    });
  }

  async updateLastAppointmentRating(negocioId: number, clienteTelefono: string, rating: number): Promise<boolean> {
    const cita = await this.prisma.cita.findFirst({
      where: {
        negocioId,
        clienteTelefono,
        encuestaEnviada: true,
        rating: null,
      },
      orderBy: { fecha: 'desc' },
    });
    if (!cita) return false;
    
    await this.prisma.cita.update({
      where: { id: cita.id },
      data: { rating },
    });
    return true;
  }
}
