import { negocioRepository } from '../repositories/negocio.repository';
import { ValidationError, NotFoundError } from '../domain/errors';
import { z } from 'zod';

const credsSchema = z.object({
  waAccessToken: z.string().min(20, 'Token de acceso inválido'),
  waPhoneNumberId: z.string().min(1, 'Phone Number ID requerido'),
  waWabaId: z.string().min(1, 'WABA ID requerido'),
});

export const saveWhatsappCredentials = async (
  negocioId: number,
  creds: unknown,
): Promise<{
  success: boolean;
  message: string;
  isWaConnected: boolean;
  phoneNumberId: string;
}> => {
  const parsed = credsSchema.safeParse(creds);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { waAccessToken, waPhoneNumberId, waWabaId } = parsed.data;

  await negocioRepository.update(negocioId, {
    waAccessToken,
    waPhoneNumberId,
    waWabaId,
    isWaConnected: true,
  });

  return {
    success: true,
    message: 'WhatsApp vinculado correctamente.',
    isWaConnected: true,
    phoneNumberId: waPhoneNumberId,
  };
};

export const getWhatsappStatus = async (
  negocioId: number,
): Promise<{ conectado: boolean; phoneNumberId: string | null; wabaId: string | null }> => {
  const negocio = await negocioRepository.findById(negocioId);
  if (!negocio) {
    throw new NotFoundError('Negocio');
  }

  return {
    conectado: negocio.isWaConnected,
    phoneNumberId: negocio.waPhoneNumberId,
    wabaId: negocio.waWabaId,
  };
};

export const disconnectWhatsapp = async (
  negocioId: number,
): Promise<{ success: boolean; message: string }> => {
  await negocioRepository.update(negocioId, {
    waAccessToken: null,
    waPhoneNumberId: null,
    waWabaId: null,
    isWaConnected: false,
  });

  return { success: true, message: 'WhatsApp desvinculado correctamente.' };
};
