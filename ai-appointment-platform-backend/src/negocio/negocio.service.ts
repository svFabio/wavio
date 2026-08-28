import { Inject, Injectable } from '@nestjs/common';
import { NegocioRepository } from './negocio.repository';
import { ConfiguracionService } from './configuracion.service';
import { ValidationError, NotFoundError } from '../domain/errors';
import { RedisService } from '../lib/redis/redis.service';
import { cached, invalidate } from '../lib/redis/cache-helpers';
import type { Negocio, Configuracion } from '../domain/types';

const CACHE_TTL = {
  NEGOCIO_BY_PHONE: 60,
  CONFIGURACION: 60,
  ACTIVE_BUSINESS_IDS: 120,
} as const;

const CACHE_KEYS = {
  negocioByPhone: (phone: string) => `negocio:phone:${phone}`,
  configuracion: (id: number) => `configuracion:${id}`,
  activeBusinessIds: () => 'negocio:active-ids',
} as const;

@Injectable()
export class NegocioService {
  constructor(
    private readonly negocioRepository: NegocioRepository,
    private readonly configuracionService: ConfiguracionService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async findByIdForInternal(id: number): Promise<Negocio | null> {
    return this.negocioRepository.findByIdForInternal(id);
  }

  async findByWaPhoneNumberIdForInternal(phoneNumberId: string): Promise<Negocio | null> {
    return cached(
      this.redis,
      CACHE_KEYS.negocioByPhone(phoneNumberId),
      CACHE_TTL.NEGOCIO_BY_PHONE,
      () => this.negocioRepository.findByWaPhoneNumberIdForInternal(phoneNumberId),
    );
  }

  async getConfiguracion(negocioId: number): Promise<Configuracion> {
    return cached(this.redis, CACHE_KEYS.configuracion(negocioId), CACHE_TTL.CONFIGURACION, () =>
      this.configuracionService.getConfiguracion(negocioId),
    );
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

    // Invalidate caches
    await invalidate(
      this.redis,
      CACHE_KEYS.configuracion(negocioId),
      CACHE_KEYS.activeBusinessIds(),
    );
    if (data.waPhoneNumberId) {
      await invalidate(this.redis, CACHE_KEYS.negocioByPhone(data.waPhoneNumberId));
    }

    return negocio;
  }

  async disconnectWhatsApp(
    negocioId: number,
  ): Promise<Omit<Negocio, 'waAccessToken' | 'geminiApiKey'>> {
    const result = await this.negocioRepository.update(negocioId, {
      isWaConnected: false,
      waAccessToken: null,
      waPhoneNumberId: null,
      waWabaId: null,
      waAppId: null,
    });

    await invalidate(
      this.redis,
      CACHE_KEYS.configuracion(negocioId),
      CACHE_KEYS.activeBusinessIds(),
    );

    return result;
  }

  async getActiveBusinessIds(): Promise<number[]> {
    return cached(this.redis, CACHE_KEYS.activeBusinessIds(), CACHE_TTL.ACTIVE_BUSINESS_IDS, () =>
      this.negocioRepository.getActiveBusinessIds(),
    );
  }
}
