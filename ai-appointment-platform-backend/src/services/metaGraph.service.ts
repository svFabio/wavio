import { prisma } from '../lib/prisma';

export const enviarMensaje = async (negocioId: number, numero: string, mensaje: string) => {
    let negocio;
    try {
        negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
    } catch (err) {
        console.error(`[MetaGraph] Error buscando negocio ${negocioId}:`, err);
        return { success: false, error: 'Error de base de datos' };
    }

    if (!negocio || !negocio.isWaConnected || !negocio.waAccessToken || !negocio.waPhoneNumberId) {
        console.warn(`[MetaGraph] Negocio ${negocioId} no configurado para Meta API.`);
        return { success: false, error: 'Meta API no configurada' };
    }

    const META_API_VERSION = process.env.META_API_VERSION || 'v19.0';

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
            console.error(`[MetaGraph] HTTP ${response.status} enviando a ${numero}: ${errBody}`);
            return { success: false, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        if (data.error) {
            console.error(`[MetaGraph] Error enviando mensaje a ${numero}:`, data.error);
            return { success: false, error: data.error.message };
        }

        if (!data.messages || !data.messages[0]) {
            console.error(`[MetaGraph] Respuesta Meta sin messages[0]:`, data);
            return { success: false, error: 'Respuesta Meta inesperada' };
        }

        // El id de Meta (wamid) viene en data.messages[0].id
        return { success: true, waMessageId: data.messages[0].id };
    } catch (err) {
        console.error(`[MetaGraph] Exception enviando mensaje a ${numero}:`, err);
        return { success: false, error: String(err) };
    }
};

export const resolverTelefonoReal = (jid: string) => {
    // En Meta API, el JID no existe igual que en Baileys, es simplemente el numero de telefono
    // Esta funcion es temporal por retrocompatibilidad
    return jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
};
