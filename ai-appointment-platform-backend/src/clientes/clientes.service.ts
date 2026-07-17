import { Injectable } from '@nestjs/common';
import { ClientesRepository } from '../repositories/clientes.repository';
import { NotFoundError, ConflictError } from '../domain/errors';
import type { Cliente } from '../domain/types';

@Injectable()
export class ClientesService {
  constructor(private readonly clientesRepository: ClientesRepository) {}

  async getAll(
    negocioId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.clientesRepository.findByNegocioId(negocioId, page, limit);
  }

  async getById(negocioId: number, clienteId: number): Promise<Cliente> {
    const cliente = await this.clientesRepository.findById(clienteId, negocioId);
    if (!cliente) {
      throw new NotFoundError('Cliente');
    }
    return cliente;
  }

  async create(
    negocioId: number,
    data: { nombre: string; telefono: string; email?: string; notas?: string },
  ): Promise<Cliente> {
    const existing = await this.clientesRepository.findByTelefono(data.telefono, negocioId);
    if (existing) {
      throw new ConflictError('Ya existe un cliente con ese telefono en este negocio');
    }
    return this.clientesRepository.create({ negocioId, ...data });
  }

  async update(
    negocioId: number,
    clienteId: number,
    data: Partial<{ nombre: string; email: string; notas: string }>,
  ): Promise<Cliente> {
    const existing = await this.clientesRepository.findById(clienteId, negocioId);
    if (!existing) {
      throw new NotFoundError('Cliente');
    }
    return this.clientesRepository.update(clienteId, negocioId, data);
  }

  async remove(negocioId: number, clienteId: number): Promise<void> {
    const existing = await this.clientesRepository.findById(clienteId, negocioId);
    if (!existing) {
      throw new NotFoundError('Cliente');
    }
    await this.clientesRepository.delete(clienteId, negocioId);
  }
}
