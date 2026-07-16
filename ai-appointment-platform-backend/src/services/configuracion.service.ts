import { configuracionRepository } from '../repositories/configuracion.repository';
import { ValidationError } from '../domain/errors';
import { uploadBase64Image } from '../lib/cloudinary';
import type { Configuracion } from '../domain/types';

interface UpdateConfiguracionInput {
  trigger?: string;
  mensajeBienvenida?: string;
  mensajeConfirmacion?: string;
  qrFotoUrl?: string | null;
  cobrarAdelanto?: boolean;
  porcentajeAdelanto?: number;
  timezone?: string;
  chatFlow?: Record<string, unknown>;
}

export const configuracionService = {
  async getConfiguracion(negocioId: number): Promise<Configuracion> {
    return configuracionRepository.getOrCreateByNegocioId(negocioId);
  },

  async updateConfiguracion(
    negocioId: number,
    data: UpdateConfiguracionInput,
  ): Promise<Configuracion> {
    const updateData: Record<string, unknown> = {};
    if (data.trigger !== undefined) updateData.trigger = data.trigger.trim();
    if (data.mensajeBienvenida !== undefined) updateData.mensajeBienvenida = data.mensajeBienvenida;
    if (data.mensajeConfirmacion !== undefined)
      updateData.mensajeConfirmacion = data.mensajeConfirmacion;
    if (data.qrFotoUrl !== undefined) updateData.qrFotoUrl = data.qrFotoUrl;
    if (data.cobrarAdelanto !== undefined) updateData.cobrarAdelanto = data.cobrarAdelanto;
    if (data.porcentajeAdelanto !== undefined)
      updateData.porcentajeAdelanto = data.porcentajeAdelanto;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.chatFlow !== undefined) updateData.chatFlow = data.chatFlow;

    return configuracionRepository.upsert(negocioId, updateData);
  },

  async uploadQR(negocioId: number, imagen: string): Promise<{ qrFotoUrl: string }> {
    if (!imagen || typeof imagen !== 'string') {
      throw new ValidationError('imagen es requerida y debe ser un string base64');
    }

    const qrFotoUrl = await uploadBase64Image(imagen, `wavio/qr/${negocioId}`);

    await configuracionRepository.upsert(negocioId, { qrFotoUrl });

    return { qrFotoUrl };
  },
};
