import { prisma } from '../repositories/prisma';
import { Configuracion } from '../domain/types';

export const configuracionRepository = {
  async getOrCreateByNegocioId(negocioId: number): Promise<Configuracion> {
    const config = await prisma.configuracion.upsert({
      where: { negocioId },
      update: {},
      create: { negocioId },
    });
    return config as unknown as Configuracion;
  },
  async upsert(negocioId: number, data: Record<string, unknown>): Promise<Configuracion> {
    const config = await prisma.configuracion.upsert({
      where: { negocioId },
      update: data,
      create: { negocioId, ...data },
    });
    return config as unknown as Configuracion;
  },
};
