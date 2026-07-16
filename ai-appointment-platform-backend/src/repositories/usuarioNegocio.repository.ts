import { prisma } from './prisma';
import { Rol } from '@prisma/client';

export const usuarioNegocioRepository = {
  async findByUsuarioIdAndNegocioId(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
  },

  async upsertMembership(
    usuarioId: number,
    negocioId: number,
    rol: string,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string }> {
    return prisma.usuarioNegocio.upsert({
      where: {
        usuarioId_negocioId: { usuarioId, negocioId },
      },
      update: {},
      create: { usuarioId, negocioId, rol: rol as Rol },
    });
  },
};
