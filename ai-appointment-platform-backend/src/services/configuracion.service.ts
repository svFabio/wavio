import { configuracionRepository } from '../repositories/configuracion.repository';
import { ValidationError } from '../domain/errors';
import type { Configuracion } from '../domain/types';

export const configuracionService = {
  async getConfiguracion(negocioId: number): Promise<Configuracion> {
    return configuracionRepository.getOrCreateByNegocioId(negocioId);
  },

  async updateConfiguracion(
    negocioId: number,
    data: Record<string, unknown>,
  ): Promise<Configuracion> {
    const {
      trigger,
      mensajeBienvenida,
      mensajeConfirmacion,
      cobrarAdelanto,
      porcentajeAdelanto,
      timezone,
      chatFlow,
    } = data;

    if (trigger !== undefined && (typeof trigger !== 'string' || trigger.trim().length === 0)) {
      throw new ValidationError('El trigger no puede estar vacio');
    }
    if (
      porcentajeAdelanto !== undefined &&
      (typeof porcentajeAdelanto !== 'number' || porcentajeAdelanto < 1 || porcentajeAdelanto > 100)
    ) {
      throw new ValidationError('porcentajeAdelanto debe ser un numero entre 1 y 100');
    }
    if (timezone !== undefined && typeof timezone !== 'string') {
      throw new ValidationError('timezone debe ser un string válido (ej: America/La_Paz)');
    }
    if (chatFlow !== undefined && typeof chatFlow !== 'object') {
      throw new ValidationError('chatFlow debe ser un objeto JSON válido');
    }

    const updateData: Partial<{
      trigger: string;
      mensajeBienvenida: string;
      mensajeConfirmacion: string;
      cobrarAdelanto: boolean;
      porcentajeAdelanto: number;
      timezone: string;
      chatFlow: unknown;
    }> = {};
    if (trigger !== undefined) updateData.trigger = (trigger as string).trim();
    if (mensajeBienvenida !== undefined) updateData.mensajeBienvenida = mensajeBienvenida as string;
    if (mensajeConfirmacion !== undefined)
      updateData.mensajeConfirmacion = mensajeConfirmacion as string;
    if (cobrarAdelanto !== undefined) updateData.cobrarAdelanto = Boolean(cobrarAdelanto);
    if (porcentajeAdelanto !== undefined)
      updateData.porcentajeAdelanto = Number(porcentajeAdelanto);
    if (timezone !== undefined) updateData.timezone = timezone as string;
    if (chatFlow !== undefined) updateData.chatFlow = chatFlow;

    return configuracionRepository.upsert(negocioId, updateData);
  },
};
