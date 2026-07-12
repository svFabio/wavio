import { prisma } from '../repositories/prisma';
import { Negocio } from '../domain/types';

const NEGOCIO_SAFE_SELECT = {
  id: true, googleId: true, email: true, nombre: true,
  plan: true, waPhoneNumberId: true, waWabaId: true,
  waAppId: true, isWaConnected: true, creadoEn: true,
} as const;

export const negocioRepository = {
  async findByWaPhoneNumberId(waPhoneNumberId: string): Promise<Negocio | null> {
    const negocio = await prisma.negocio.findUnique({
      where: { waPhoneNumberId },
      include: { configuracion: true }
    });
    return negocio as unknown as Negocio;
  },

  async findById(id: number) {
    const negocio = await prisma.negocio.findUnique({
      where: { id },
      select: NEGOCIO_SAFE_SELECT
    });
    return negocio;
  },

  async findByIdForInternal(id: number) {
    return prisma.negocio.findUnique({
      where: { id },
      select: { ...NEGOCIO_SAFE_SELECT, waAccessToken: true }
    });
  },

  async findByIdWithConfig(id: number) {
    return prisma.negocio.findUnique({
      where: { id },
      include: { configuracion: true }
    });
  },

  async update(id: number, data: Record<string, unknown>) {
    const negocio = await prisma.negocio.update({
      where: { id },
      data,
      select: NEGOCIO_SAFE_SELECT
    });
    return negocio;
  }
};
