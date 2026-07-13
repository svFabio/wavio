import { chatRepository } from '../repositories/chat.repository';
import { enviarMensaje, resolverTelefonoReal } from '../lib/whatsapp';
import { getSocket } from '../lib/socket';
import { ValidationError, AppError } from '../domain/errors';
import pino from 'pino';

const logger = pino();

export const chatService = {
    async getConversaciones(negocioId: number) {
        const conversaciones = await chatRepository.getConversaciones(negocioId);
        return conversaciones.map(c => ({
            ...c,
            telefonoReal: resolverTelefonoReal(c.remoteJid)
        }));
    },

    async getMensajes(negocioId: number, jid: string) {
        return chatRepository.getMensajes(negocioId, jid);
    },

    async sendMensaje(negocioId: number, jid: string, texto: string) {
        if (!texto || typeof texto !== 'string' || !texto.trim()) {
            throw new ValidationError('Texto requerido y debe ser texto válido');
        }

        const resultado = await enviarMensaje(negocioId, jid, texto.trim());

        if (!resultado.success) {
            throw new AppError(resultado.error || 'WhatsApp no conectado', 502, 'WHATSAPP_ERROR');
        }

        await chatRepository.createMensaje({
            remoteJid: jid,
            contenido: texto.trim(),
            direccion: 'SALIENTE',
            waMessageId: resultado.waMessageId || null,
            estadoEntrega: 'enviado',
            negocioId
        });

        return { success: true };
    },

    async deleteConversacion(negocioId: number, jid: string) {
        const count = await chatRepository.deleteConversacion(negocioId, jid);
        
        logger.info({ negocioId, jid, count }, '[Chat] 🗑 Conversación eliminada');

        try {
            getSocket().emit('conversacion-eliminada', { remoteJid: jid });
        } catch (e) {
            logger.warn({ err: e }, 'Socket error on deleteConversacion');
        }

        return { success: true, eliminados: count };
    }
};
