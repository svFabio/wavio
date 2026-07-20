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
    const result = await this.prisma.listaEspera.create({
      data: {
        negocioId,
        clienteNombre: data.clienteNombre,
        clienteTelefono: data.clienteTelefono,
        servicioId: data.servicioId ?? null,
        fechaPreferida: data.fechaPreferida,
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
    return this.prisma.listaEspera.findMany({
      where: {
        negocioId,
        estado: 'PENDIENTE',
        fechaPreferida: {
          gte: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
          lt: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1),
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

  async getWaitlistCount(negocioId: number): Promise<number> {
    return this.prisma.listaEspera.count({
      where: { negocioId, estado: 'PENDIENTE' },
    });
  }
}
