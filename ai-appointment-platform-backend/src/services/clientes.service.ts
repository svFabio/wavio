import { clientesRepository } from '../repositories/clientes.repository';
import { NotFoundError, ConflictError } from '../domain/errors';
import { Cliente } from '../domain/types';

export const clientesService = {
  async listarClientes(
    negocioId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Cliente[]; total: number; page: number; limit: number; totalPages: number }> {
    return clientesRepository.findByNegocioId(negocioId, page, limit);
  },

  async obtenerCliente(negocioId: number, clienteId: number): Promise<Cliente> {
    const cliente = await clientesRepository.findById(clienteId, negocioId);
    if (!cliente) {
      throw new NotFoundError('Cliente');
    }
    return cliente;
  },

  async crearCliente(
    negocioId: number,
    data: { nombre: string; telefono: string; email?: string; notas?: string },
  ): Promise<Cliente> {
    const existing = await clientesRepository.findByTelefono(data.telefono, negocioId);
    if (existing) {
      throw new ConflictError('Ya existe un cliente con ese telefono en este negocio');
    }
    return clientesRepository.create({ negocioId, ...data });
  },

  async actualizarCliente(
    negocioId: number,
    clienteId: number,
    data: Partial<{ nombre: string; email: string; notas: string }>,
  ): Promise<Cliente> {
    const existing = await clientesRepository.findById(clienteId, negocioId);
    if (!existing) {
      throw new NotFoundError('Cliente');
    }
    return clientesRepository.update(clienteId, negocioId, data);
  },

  async eliminarCliente(negocioId: number, clienteId: number): Promise<void> {
    const existing = await clientesRepository.findById(clienteId, negocioId);
    if (!existing) {
      throw new NotFoundError('Cliente');
    }
    await clientesRepository.delete(clienteId, negocioId);
  },
};
