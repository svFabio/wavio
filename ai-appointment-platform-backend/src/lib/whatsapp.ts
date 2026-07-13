import { negocioRepository } from '../repositories/negocio.repository';
import { env } from '../config/env';
import pino from 'pino';

const logger = pino();

export const enviarMensaje = async (negocioId: number, numero: string, mensaje: string): Promise<{ success: boolean; error?: string; waMessageId?: string }> => {
    let negocio;
    try {
        negocio = await negocioRepository.findByIdForInternal(negocioId);
    } catch (err) {
        logger.error({ err }, `[MetaGraph] Error buscando negocio ${negocioId}`);
        return { success: false, error: 'Error de base de datos' };
    }

    if (!negocio || !negocio.isWaConnected || !negocio.waAccessToken || !negocio.waPhoneNumberId) {
        logger.warn(`[MetaGraph] Negocio ${negocioId} no configurado para Meta API.`);
        return { success: false, error: 'Meta API no configurada' };
    }

    const META_API_VERSION = env.META_API_VERSION;

    try {
        const response = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${negocio.waPhoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${negocio.waAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: numero,
                type: 'text',
                text: { preview_url: false, body: mensaje }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            logger.error(`[MetaGraph] HTTP ${response.status} enviando a ${numero}: ${errBody}`);
            return { success: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        if (data.error) {
            logger.error({ err: data.error }, `[MetaGraph] Error enviando mensaje a ${numero}`);
            return { success: false, error: data.error.message };
        }

        if (!data.messages || !data.messages[0]) {
            logger.error({ data }, `[MetaGraph] Respuesta Meta sin messages[0]`);
            return { success: false, error: 'Respuesta Meta inesperada' };
        }

        return { success: true, waMessageId: data.messages[0].id };
    } catch (err) {
        logger.error({ err }, `[MetaGraph] Exception enviando mensaje a ${numero}`);
        return { success: false, error: String(err) };
    }
};

export const resolverTelefonoReal = (waId: string): string => {
    return waId.replace('@s.whatsapp.net', '').replace('@c.us', '');
};
