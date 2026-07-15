import { prisma } from './prisma';

export const usuarioNegocioRepository = {
  async findByUsuarioIdAndNegocioId(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
  },
};
