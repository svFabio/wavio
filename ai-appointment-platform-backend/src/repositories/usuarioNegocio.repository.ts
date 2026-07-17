import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

@Injectable()
export class UsuarioNegocioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsuarioIdAndNegocioId(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
  }

  async upsertMembership(
    usuarioId: number,
    negocioId: number,
    rol: string,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string }> {
    return this.prisma.usuarioNegocio.upsert({
      where: {
        usuarioId_negocioId: { usuarioId, negocioId },
      },
      update: {},
      create: { usuarioId, negocioId, rol: rol as Rol },
    });
  }
}
