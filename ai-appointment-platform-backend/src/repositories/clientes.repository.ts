import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { prisma } from './prisma';
import type { Cliente } from '../domain/types';
import { NotFoundError } from '../domain/errors';

@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNegocioId(
    negocioId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where: { negocioId },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.cliente.count({ where: { negocioId } }),
    ]);
    return {
      data: records as unknown as Cliente[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, negocioId: number): Promise<Cliente | null> {
    const record = await this.prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    return record as unknown as Cliente | null;
  }

  async findByTelefono(telefono: string, negocioId: number): Promise<Cliente | null> {
    const record = await this.prisma.cliente.findUnique({
      where: { negocioId_telefono: { negocioId, telefono } },
    });
    return record as unknown as Cliente | null;
  }

  async create(data: {
    negocioId: number;
    nombre: string;
    telefono: string;
    email?: string;
    notas?: string;
  }): Promise<Cliente> {
    const record = await this.prisma.cliente.create({ data });
    return record as unknown as Cliente;
  }

  async update(
    id: number,
    negocioId: number,
    data: Partial<{ nombre: string; email: string; notas: string }>,
  ): Promise<Cliente> {
    const existing = await this.prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    if (!existing) throw new NotFoundError('Cliente');

    const record = await this.prisma.cliente.update({
      where: { id },
      data,
    });
    return record as unknown as Cliente;
  }

  async delete(id: number, negocioId: number): Promise<void> {
    const existing = await this.prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    if (!existing) throw new NotFoundError('Cliente');

    await this.prisma.cliente.delete({
      where: { id },
    });
  }
}

// Backward-compatible singleton for Express routes
export const clientesRepository = new ClientesRepository(prisma as never);
