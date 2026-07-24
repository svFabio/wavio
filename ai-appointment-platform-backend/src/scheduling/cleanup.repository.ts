import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteInactiveSessions(limitDate: Date): Promise<number> {
    const result = await this.prisma.sesionChat.deleteMany({
      where: { ultimoMensaje: { lt: limitDate } },
    });
    return result.count;
  }

  async cancelExpiredInProgressAppointments(limitDate: Date): Promise<number> {
    const result = await this.prisma.cita.updateMany({
      where: {
        estado: 'EN_PROCESO',
        creadoEn: { lt: limitDate },
      },
      data: { estado: 'CANCELADA' },
    });
    return result.count;
  }
}
