import { Injectable } from '@nestjs/common';
import { NegocioRepository } from './negocio.repository';
import { ConfiguracionService } from './configuracion.service';
import { ValidationError, NotFoundError } from '../domain/errors';
import type { Negocio, Configuracion } from '../domain/types';

@Injectable()
export class NegocioService {
  constructor(
    private readonly negocioRepository: NegocioRepository,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  async findByIdForInternal(id: number): Promise<Negocio | null> {
    return this.negocioRepository.findByIdForInternal(id);
  }

  async findByWaPhoneNumberIdForInternal(phoneNumberId: string): Promise<Negocio | null> {
    return this.negocioRepository.findByWaPhoneNumberIdForInternal(phoneNumberId);
  }

  async getConfiguracion(negocioId: number): Promise<Configuracion> {
    return this.configuracionService.getConfiguracion(negocioId);
  }

  async configurarNegocio(
    negocioId: number,
    nombre: string,
  ): Promise<Omit<Negocio, 'waAccessToken' | 'geminiApiKey'>> {
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

  async actualizarCredenciales(
    negocioId: number,
    data: {
      waAccessToken?: string;
      waPhoneNumberId?: string;
      waWabaId?: string;
      waAppId?: string;
      geminiApiKey?: string;
    },
  ): Promise<Omit<Negocio, 'waAccessToken' | 'geminiApiKey'>> {
    const updateData: Record<string, unknown> = {};
    if (data.waAccessToken !== undefined) updateData.waAccessToken = data.waAccessToken.trim();
    if (data.waPhoneNumberId !== undefined)
      updateData.waPhoneNumberId = data.waPhoneNumberId.trim();
    if (data.waWabaId !== undefined) updateData.waWabaId = data.waWabaId.trim();
    if (data.waAppId !== undefined) updateData.waAppId = data.waAppId.trim();
    if (data.geminiApiKey !== undefined) updateData.geminiApiKey = data.geminiApiKey.trim();

    if (data.waAccessToken || data.waPhoneNumberId) {
      updateData.isWaConnected = true;
    }

    const negocio = await this.negocioRepository.update(negocioId, updateData);
    return negocio;
  }

  async getActiveBusinessIds(): Promise<number[]> {
    return this.negocioRepository.getActiveBusinessIds();
  }
}
