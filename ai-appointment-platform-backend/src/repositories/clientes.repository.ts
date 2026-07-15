import { prisma } from './prisma';
import type { Cliente } from '../domain/types';

export const clientesRepository = {
  async findByNegocioId(negocioId: number): Promise<Cliente[]> {
    const records = await prisma.cliente.findMany({
      where: { negocioId },
      orderBy: { nombre: 'asc' },
    });
    return records as unknown as Cliente[];
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
    const record = await prisma.cliente.update({
      where: { id },
      data,
    });
    return record as unknown as Cliente;
  },

  async delete(id: number, negocioId: number): Promise<void> {
    await prisma.cliente.delete({
      where: { id },
    });
  },
};
