import { Injectable } from '@nestjs/common';
import { NegocioRepository } from '../repositories/negocio.repository';
import { ValidationError, NotFoundError } from '../domain/errors';
import type { Negocio } from '../domain/types';

@Injectable()
export class NegocioService {
  constructor(private readonly negocioRepository: NegocioRepository) {}

  async configurarNegocio(
    negocioId: number,
    nombre: string,
  ): Promise<Omit<Negocio, 'waAccessToken'>> {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      throw new ValidationError('El nombre del negocio es inválido');
    }

    const negocio = await this.negocioRepository.update(negocioId, { nombre: nombre.trim() });
    if (!negocio) {
      throw new NotFoundError('Negocio');
    }

    return negocio;
  }

  async getWaStatus(negocioId: number): Promise<{ connected: boolean; phone: string | undefined }> {
    const negocio = await this.negocioRepository.findById(negocioId);
    return {
      connected: negocio?.isWaConnected ?? false,
      phone: negocio?.waPhoneNumberId ?? undefined,
    };
  }
}
