import { env } from '../config/env';
import { WhatsAppError, ExternalServiceError } from '../domain/errors';
import pino from 'pino';

const logger = pino();

const sanitizeForLog = (value: unknown): string => String(value).replace(/[\r\n\t\f\v\0\x00-\x1F\x7F]/g, ' ');

export type WaCredentials = {
  waAccessToken: string;
  waPhoneNumberId: string;
};

export const enviarMensaje = async (
  credentials: WaCredentials,
  numero: string,
  mensaje: string,
): Promise<{ success: true; waMessageId: string }> => {
  if (!credentials.waAccessToken || !credentials.waPhoneNumberId) {
    throw new WhatsAppError('WhatsApp no configurado');
  }

  const META_API_VERSION = env.META_API_VERSION;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${credentials.waPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numero,
          type: 'text',
          text: { preview_url: false, body: mensaje },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      logger.error(
        {
          status: response.status,
          numero: sanitizeForLog(numero),
          errBody: sanitizeForLog(errBody),
        },
        '[MetaGraph] HTTP error enviando mensaje',
      );
      throw new ExternalServiceError(
        `Meta API responded with HTTP ${response.status}`,
        'WHATSAPP_ERROR',
        502,
      );
    }

    const data = await response.json();
    if (data.error) {
      logger.error(
        { err: data.error, numero: sanitizeForLog(numero) },
        '[MetaGraph] Error enviando mensaje',
      );
      throw new ExternalServiceError(data.error.message || 'Meta API error', 'WHATSAPP_ERROR', 502);
    }

    if (!data.messages || !data.messages[0]) {
      logger.error({ data }, `[MetaGraph] Respuesta Meta sin messages[0]`);
      throw new ExternalServiceError('Meta API response inesperada', 'WHATSAPP_ERROR', 502);
    }

    return { success: true, waMessageId: data.messages[0].id };
  } catch (err) {
    if (err instanceof WhatsAppError || err instanceof ExternalServiceError) {
      throw err;
    }
    logger.error(
      { err, numero: sanitizeForLog(numero) },
      '[MetaGraph] Exception enviando mensaje',
    );
    throw new ExternalServiceError(String(err), 'WHATSAPP_ERROR', 502);
  }
};

export const resolverTelefonoReal = (waId: string): string => {
  return waId.replace('@s.whatsapp.net', '').replace('@c.us', '');
};

export const enviarImagen = async (
  credentials: WaCredentials,
  numero: string,
  imageUrl: string,
  caption: string,
): Promise<{ success: true; waMessageId: string }> => {
  if (!credentials.waAccessToken || !credentials.waPhoneNumberId) {
    throw new WhatsAppError('WhatsApp no configurado');
  }

  const META_API_VERSION = env.META_API_VERSION;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${credentials.waPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.waAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numero,
          type: 'image',
          image: { link: imageUrl, caption },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text();
      logger.error(
        {
          httpStatus: response.status,
          numero: sanitizeForLog(numero),
          errBody: sanitizeForLog(errBody),
        },
        '[MetaGraph] Error enviando imagen',
      );
      throw new ExternalServiceError(
        `Meta API responded with HTTP ${response.status}`,
        'WHATSAPP_ERROR',
        502,
      );
    }

    const data = await response.json();
    if (data.error) {
      logger.error(
        { err: data.error, numero: sanitizeForLog(numero) },
        '[MetaGraph] Error enviando imagen',
      );
      throw new ExternalServiceError(data.error.message || 'Meta API error', 'WHATSAPP_ERROR', 502);
    }

    if (!data.messages || !data.messages[0]) {
      logger.error({ data }, `[MetaGraph] Respuesta Meta sin messages[0]`);
      throw new ExternalServiceError('Meta API response inesperada', 'WHATSAPP_ERROR', 502);
    }

    return { success: true, waMessageId: data.messages[0].id };
  } catch (err) {
    if (err instanceof WhatsAppError || err instanceof ExternalServiceError) {
      throw err;
    }
    logger.error({ err, numero: sanitizeForLog(numero) }, '[MetaGraph] Exception enviando imagen');
    throw new ExternalServiceError(String(err), 'WHATSAPP_ERROR', 502);
  }
};
