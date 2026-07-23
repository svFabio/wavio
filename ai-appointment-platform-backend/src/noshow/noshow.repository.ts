import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NoShowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async markAsNoShow(citaId: number): Promise<void> {
    await this.prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'NO_ASISTIO' },
    });
  }

  async findCitaById(citaId: number): Promise<{ clienteTelefono: string } | null> {
    return this.prisma.cita.findUnique({
      where: { id: citaId },
      select: { clienteTelefono: true },
    });
  }

  async incrementNoShowCount(negocioId: number, clienteTelefono: string): Promise<number> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { negocioId, telefono: clienteTelefono },
    });

    if (!cliente) return 0;

    const updated = await this.prisma.cliente.update({
      where: { id: cliente.id },
      data: { noShowCount: { increment: 1 } },
    });

    return updated.noShowCount;
  }

  async getNoShowStats(negocioId: number): Promise<
    Array<{
      clienteNombre: string;
      clienteTelefono: string;
      noShowCount: number;
      blocked: boolean;
    }>
  > {
    const clientes = await this.prisma.cliente.findMany({
      where: {
        negocioId,
        noShowCount: { gt: 0 },
      },
      select: {
        nombre: true,
        telefono: true,
        noShowCount: true,
        blocked: true,
      },
      orderBy: { noShowCount: 'desc' },
    });
    return clientes.map((c) => ({
      clienteNombre: c.nombre,
      clienteTelefono: c.telefono,
      noShowCount: c.noShowCount,
      blocked: c.blocked,
    }));
  }

  async blockClient(negocioId: number, clienteTelefono: string): Promise<void> {
    await this.prisma.cliente.updateMany({
      where: { negocioId, telefono: clienteTelefono },
      data: { blocked: true },
    });
  }

  async unblockClient(negocioId: number, clienteTelefono: string): Promise<void> {
    await this.prisma.cliente.updateMany({
      where: { negocioId, telefono: clienteTelefono },
      data: { blocked: false },
    });
  }

  async isClientBlocked(negocioId: number, clienteTelefono: string): Promise<boolean> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { negocioId, telefono: clienteTelefono },
      select: { blocked: true },
    });
    return cliente?.blocked ?? false;
  }

  async getExpiredInProgressAppointments(
    negocioId: number,
    minutesAgo: number,
  ): Promise<
    Array<{
      id: number;
      clienteNombre: string | null;
      clienteTelefono: string;
      fecha: Date;
      horario: string;
    }>
  > {
    const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
    return this.prisma.cita.findMany({
      where: {
        negocioId,
        estado: 'EN_PROCESO',
        fecha: { lt: cutoff },
      },
      select: {
        id: true,
        clienteNombre: true,
        clienteTelefono: true,
        fecha: true,
        horario: true,
      },
    });
  }
}
