import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type SesionChatRow = {
  id: string;
  estado: string;
  datos: Prisma.JsonValue;
  ultimoMensaje: Date;
  negocioId: number;
};

@Injectable()
export class SesionChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByJid(jid: string, negocioId: number): Promise<SesionChatRow | null> {
    return this.prisma.sesionChat.findFirst({
      where: { id: jid, negocioId },
    });
  }

  async upsert(
    jid: string,
    negocioId: number,
    data: { estado: string; datos: Record<string, unknown> },
  ): Promise<SesionChatRow> {
    return this.prisma.sesionChat.upsert({
      where: { id_negocioId: { id: jid, negocioId } },
      update: {
        estado: data.estado,
        datos: data.datos as Prisma.InputJsonValue,
        ultimoMensaje: new Date(),
      },
      create: {
        id: jid,
        negocioId,
        estado: data.estado,
        datos: data.datos as Prisma.InputJsonValue,
        ultimoMensaje: new Date(),
      },
    });
  }

  async deleteInactiveSessions(limitDate: Date): Promise<number> {
    const result = await this.prisma.sesionChat.deleteMany({
      where: { ultimoMensaje: { lt: limitDate } },
    });
    return result.count;
  }
}
