import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addToWaitlist(
    negocioId: number,
    data: {
      clienteNombre: string;
      clienteTelefono: string;
      servicioId?: number;
      fechaPreferida: Date;
      horarioPreferido?: string;
    },
  ): Promise<{ id: number }> {
    const isoDate =
      data.fechaPreferida instanceof Date
        ? data.fechaPreferida.toISOString().split('T')[0]
        : String(data.fechaPreferida).split('T')[0];
    const fechaUtc = new Date(`${isoDate}T00:00:00.000Z`);

    const result = await this.prisma.listaEspera.create({
      data: {
        negocioId,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        servicioId: data.servicioId ?? null,
        fechaPreferida: fechaUtc,
        horarioPreferido: data.horarioPreferido ?? null,
      },
    });
    return { id: result.id };
  }

  async getPendingForDate(
    negocioId: number,
    fecha: Date,
  ): Promise<
    Array<{
      id: number;
      clienteNombre: string;
      clienteTelefono: string;
      servicioId: number | null;
      horarioPreferido: string | null;
      creadoEn: Date;
    }>
  > {
    const isoDate =
      fecha instanceof Date ? fecha.toISOString().split('T')[0] : String(fecha).split('T')[0];
    const inicioUtc = new Date(`${isoDate}T00:00:00.000Z`);
    const finUtc = new Date(`${isoDate}T23:59:59.999Z`);

    return this.prisma.listaEspera.findMany({
      where: {
        negocioId,
        estado: 'PENDIENTE',
        fechaPreferida: {
          gte: inicioUtc,
          lte: finUtc,
        },
      },
      orderBy: { creadoEn: 'asc' },
    });
  }

  async markNotified(id: number): Promise<void> {
    await this.prisma.listaEspera.update({
      where: { id },
      data: { estado: 'NOTIFICADA', notificadoEn: new Date() },
    });
  }

  async confirmEntry(id: number): Promise<void> {
    await this.prisma.listaEspera.update({
      where: { id },
      data: { estado: 'CONFIRMADA' },
    });
  }

  async cancelEntry(id: number): Promise<void> {
    await this.prisma.listaEspera.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    });
  }

  async getAll(negocioId: number) {
    return this.prisma.listaEspera.findMany({
      where: { negocioId },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async getWaitlistCount(negocioId: number): Promise<number> {
    return this.prisma.listaEspera.count({
      where: { negocioId, estado: 'PENDIENTE' },
    });
  }
}
