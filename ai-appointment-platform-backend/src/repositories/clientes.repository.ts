import { prisma } from './prisma';
import type { Cliente } from '../domain/types';
import { NotFoundError } from '../domain/errors';

export const clientesRepository = {
  async findByNegocioId(
    negocioId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      prisma.cliente.findMany({
        where: { negocioId },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      prisma.cliente.count({ where: { negocioId } }),
    ]);
    return {
      data: records as unknown as Cliente[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: number, negocioId: number): Promise<Cliente | null> {
    const record = await prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    return record as unknown as Cliente | null;
  },

  async findByTelefono(telefono: string, negocioId: number): Promise<Cliente | null> {
    const record = await prisma.cliente.findUnique({
      where: { negocioId_telefono: { negocioId, telefono } },
    });
    return record as unknown as Cliente | null;
  },

  async create(data: {
    negocioId: number;
    nombre: string;
    telefono: string;
    email?: string;
    notas?: string;
  }): Promise<Cliente> {
    const record = await prisma.cliente.create({ data });
    return record as unknown as Cliente;
  },

  async update(
    id: number,
    negocioId: number,
    data: Partial<{ nombre: string; email: string; notas: string }>,
  ): Promise<Cliente> {
    const existing = await prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    if (!existing) throw new NotFoundError('Cliente');

    const record = await prisma.cliente.update({
      where: { id },
      data,
    });
    return record as unknown as Cliente;
  },

  async delete(id: number, negocioId: number): Promise<void> {
    const existing = await prisma.cliente.findFirst({
      where: { id, negocioId },
    });
    if (!existing) throw new NotFoundError('Cliente');

    await prisma.cliente.delete({
      where: { id },
    });
  },
};
