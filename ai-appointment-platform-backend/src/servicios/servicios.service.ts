import { Injectable } from '@nestjs/common';
import { ServiciosRepository } from '../repositories/servicios.repository';
import { AppError } from '../domain/errors';
import type { Servicio } from '../domain/types';

@Injectable()
export class ServiciosService {
  constructor(private readonly serviciosRepository: ServiciosRepository) {}

  async getAll(negocioId: number): Promise<Servicio[]> {
    return this.serviciosRepository.findByNegocioId(negocioId);
  }

  async create(
    negocioId: number,
    data: { nombre: string; duracionMinutos?: number; bufferMinutos?: number; precio?: number },
  ): Promise<Servicio> {
    return this.serviciosRepository.create({
      negocioId,
      nombre: data.nombre,
      duracionMinutos: data.duracionMinutos ?? 60,
      bufferMinutos: data.bufferMinutos ?? 0,
      precio: data.precio ?? 0,
    });
  }

  async update(
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
    const existing = await this.serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    return this.serviciosRepository.update(id, data);
  }

  async remove(negocioId: number, id: number): Promise<void> {
    const existing = await this.serviciosRepository.findById(id);
    if (!existing || existing.negocioId !== negocioId) {
      throw new AppError('Servicio no encontrado', 404, 'SERVICIO_NOT_FOUND');
    }
    await this.serviciosRepository.softDelete(id);
  }
}
