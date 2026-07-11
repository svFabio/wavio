import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const enviarMensaje = async (negocioId: number, numero: string, mensaje: string) => {
    const negocio = await prisma.negocio.findUnique({ where: { id: negocioId } });
    if (!negocio || !negocio.isWaConnected || !negocio.waAccessToken || !negocio.waPhoneNumberId) {
        console.warn(`[MetaGraph] Negocio ${negocioId} no configurado para Meta API.`);
        return { success: false, error: 'Meta API no configurada' };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${negocio.waPhoneNumberId}/messages`, {
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
        
        const data = await response.json();
        if (data.error) {
            console.error(`[MetaGraph] Error enviando mensaje a ${numero}:`, data.error);
            return { success: false, error: data.error.message };
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
