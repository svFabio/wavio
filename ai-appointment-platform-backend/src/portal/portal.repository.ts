import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { Cita } from '../domain/types';

@Injectable()
export class PortalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findClienteByMagicToken(token: string): Promise<{
    id: number;
    nombre: string;
    telefono: string;
    email: string | null;
    magicLinkExpiry: Date | null;
    negocio: { id: number; nombre: string };
  } | null> {
    return this.prisma.cliente.findUnique({
      where: { magicToken: token },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        magicLinkExpiry: true,
        negocio: { select: { id: true, nombre: true } },
      },
    });
  }

  async findClienteByIdAndNegocio(
    clienteId: number,
    negocioId: number,
  ): Promise<{ id: number } | null> {
    return this.prisma.cliente.findFirst({
      where: { id: clienteId, negocioId },
      select: { id: true },
    });
  }

  async updateMagicToken(clienteId: number, token: string, expiry: Date): Promise<void> {
    await this.prisma.cliente.update({
      where: { id: clienteId },
      data: { magicToken: token, magicLinkExpiry: expiry },
    });
  }

  async findCitasByCliente(
    negocioId: number,
    clienteTelefono: string,
    clienteNombre: string,
  ): Promise<Cita[]> {
    const citas = await this.prisma.cita.findMany({
      where: {
        negocioId,
        OR: [{ clienteTelefono }, { clienteNombre }],
      },
      orderBy: { fecha: 'desc' },
    });
    return citas.map((c) => ({ ...c, monto: Number(c.monto) }));
  }

  async findServiciosActivos(
    negocioId: number,
  ): Promise<Array<{ id: number; nombre: string; duracionMinutos: number; precio: number }>> {
    return this.prisma.servicio.findMany({
      where: { negocioId, activo: true },
      select: { id: true, nombre: true, duracionMinutos: true, precio: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findServicioById(
    servicioId: number,
    negocioId: number,
  ): Promise<{ id: number; nombre: string; duracionMinutos: number; precio: number } | null> {
    return this.prisma.servicio.findFirst({
      where: { id: servicioId, negocioId, activo: true },
      select: { id: true, nombre: true, duracionMinutos: true, precio: true },
    });
  }

  async findHorariosByDia(
    negocioId: number,
    diaSemana: number,
  ): Promise<Array<{ horaInicio: string; horaFin: string }>> {
    return this.prisma.horarioNegocio.findMany({
      where: { negocioId, diaSemana, activo: true },
      select: { horaInicio: true, horaFin: true },
    });
  }

  async findCitasOcupadas(
    negocioId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<Array<{ horario: string }>> {
    return this.prisma.cita.findMany({
      where: {
        negocioId,
        fecha: { gte: fechaInicio, lte: fechaFin },
        estado: { not: 'CANCELADA' },
      },
      select: { horario: true },
    });
  }

  async checkSlotOccupied(negocioId: number, fecha: Date, horario: string): Promise<boolean> {
    const cita = await this.prisma.cita.findFirst({
      where: { negocioId, fecha, horario, estado: { not: 'CANCELADA' } },
    });
    return !!cita;
  }

  async createCita(data: Prisma.CitaUncheckedCreateInput): Promise<void> {
    await this.prisma.cita.create({ data });
  }
}
