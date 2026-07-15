import { serviciosRepository } from '../repositories/servicios.repository';
import { AppError } from '../domain/errors';
import type { Servicio } from '../domain/types';

export const serviciosService = {
  async listarServicios(negocioId: number): Promise<Servicio[]> {
    return serviciosRepository.findByNegocioId(negocioId);
  },

  async crearServicio(
    negocioId: number,
    data: { nombre: string; duracionMinutos?: number; bufferMinutos?: number; precio?: number },
  ): Promise<Servicio> {
    return serviciosRepository.create({
      negocioId,
      nombre: data.nombre,
      duracionMinutos: data.duracionMinutos ?? 60,
      bufferMinutos: data.bufferMinutos ?? 0,
      precio: data.precio ?? 0,
    });
  },

  async actualizarServicio(
    negocioId: number,
    id: number,
    data: {
      nombre?: string;
      duracionMinutos?: number;
      bufferMinutos?: number;
      precio?: number;
      activo?: boolean;
    },
  ): Promise<Servicio> {
    const existing = await serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    return serviciosRepository.update(id, data);
  },

  async eliminarServicio(negocioId: number, id: number): Promise<void> {
    const existing = await serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    await serviciosRepository.softDelete(id);
  },
};
