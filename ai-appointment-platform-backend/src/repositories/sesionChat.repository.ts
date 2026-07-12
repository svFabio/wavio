import { Prisma } from '@prisma/client';
import { prisma } from '../repositories/prisma';

export const sesionChatRepository = {
    async findByJid(jid: string, negocioId: number) {
        return prisma.sesionChat.findFirst({
            where: { id: jid, negocioId }
        });
    },

    async upsert(jid: string, negocioId: number, data: { estado: string; datos: Record<string, unknown> }) {
        return prisma.sesionChat.upsert({
            where: { id: jid },
            update: { estado: data.estado, datos: data.datos as Prisma.InputJsonValue, ultimoMensaje: new Date() },
            create: { id: jid, negocioId, estado: data.estado, datos: data.datos as Prisma.InputJsonValue, ultimoMensaje: new Date() }
        });
    },

    async deleteInactiveSessions(limitDate: Date): Promise<number> {
        const resultado = await prisma.sesionChat.deleteMany({
            where: {
                ultimoMensaje: {
                    lt: limitDate
                }
            }
        });
        return resultado.count;
    }
};
