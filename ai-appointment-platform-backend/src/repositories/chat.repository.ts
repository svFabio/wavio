import { prisma } from '../repositories/prisma';
import { MensajeChat } from '../domain/types';

export interface ConversacionRaw {
    remoteJid: string;
    ultimoMensaje: Date;
    totalMensajes: number;
    ultimoContenido: string | null;
    ultimaDireccion: string | null;
    clienteNombre: string | null;
}

export const chatRepository = {
  async getUltimoMensajeEntrantePorTelefono(negocioId: number, telefono: string): Promise<Partial<MensajeChat> | null> {
    const msg = await prisma.mensajeChat.findFirst({
      where: {
        negocioId,
        remoteJid: { contains: telefono },
        direccion: 'ENTRANTE'
      },
      orderBy: { timestamp: 'desc' },
      select: { remoteJid: true }
    });
    return msg as unknown as Partial<MensajeChat>;
  },

  async getConversaciones(negocioId: number): Promise<ConversacionRaw[]> {
    return prisma.$queryRaw<ConversacionRaw[]>`
        SELECT 
            "remoteJid",
            MAX("timestamp") as "ultimoMensaje",
            COUNT(*)::int as "totalMensajes",
            (SELECT "contenido" FROM "MensajeChat" m2 
             WHERE m2."remoteJid" = m1."remoteJid" AND m2."negocioId" = ${negocioId}
             ORDER BY m2."timestamp" DESC LIMIT 1) as "ultimoContenido",
            (SELECT "direccion" FROM "MensajeChat" m3 
             WHERE m3."remoteJid" = m1."remoteJid" AND m3."negocioId" = ${negocioId}
             ORDER BY m3."timestamp" DESC LIMIT 1) as "ultimaDireccion",
            (SELECT c."clienteNombre" FROM "Cita" c
             WHERE c."clienteTelefono" = SPLIT_PART(m1."remoteJid", '@', 1) AND c."negocioId" = ${negocioId}
             ORDER BY c."creadoEn" DESC LIMIT 1) as "clienteNombre"
        FROM "MensajeChat" m1
        WHERE m1."negocioId" = ${negocioId}
        GROUP BY "remoteJid"
        ORDER BY MAX("timestamp") DESC
        LIMIT 50
    `;
  },

  async getMensajes(negocioId: number, jid: string): Promise<MensajeChat[]> {
    const mensajes = await prisma.mensajeChat.findMany({
        where: { negocioId, remoteJid: jid },
        orderBy: { timestamp: 'asc' },
        take: 200
    });
    return mensajes as unknown as MensajeChat[];
  },

  async createMensaje(data: { remoteJid: string; contenido: string; direccion: 'ENTRANTE' | 'SALIENTE'; waMessageId?: string | null; estadoEntrega: string; negocioId: number }): Promise<MensajeChat> {
    const msg = await prisma.mensajeChat.create({ data });
    return msg as unknown as MensajeChat;
  },

  async updateEstadoEntrega(waMessageId: string, estado: string): Promise<void> {
    await prisma.mensajeChat.updateMany({
      where: { waMessageId },
      data: { estadoEntrega: estado }
    });
  },

  async deleteConversacion(negocioId: number, jid: string): Promise<number> {
    const [, resultado] = await prisma.$transaction([
      prisma.mensajeChat.deleteMany({ where: { negocioId, remoteJid: jid } }),
      prisma.sesionChat.deleteMany({ where: { id: jid, negocioId } }),
    ]);
    return resultado.count;
  }
};
