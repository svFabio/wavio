import { prisma } from '../repositories/prisma';

const NEGOCIO_SAFE_SELECT = {
  id: true, googleId: true, email: true, nombre: true,
  plan: true, waPhoneNumberId: true, waWabaId: true,
  waAppId: true, isWaConnected: true, creadoEn: true,
} as const;

const USUARIO_SAFE_SELECT = {
  id: true, nombre: true, email: true, googleId: true,
  rol: true, negocioId: true, creadoEn: true, fotoPerfil: true
} as const;

export const authRepository = {
  async findNegocioByGoogleId(googleId: string) {
    return prisma.negocio.findUnique({ where: { googleId }, select: NEGOCIO_SAFE_SELECT });
  },

  async createNegocioWithAdmin(
    googleId: string,
    email: string,
    nombre: string,
    hashedPassword?: string
  ) {
    return prisma.negocio.create({
      data: {
        googleId,
        email,
        nombre,
        usuarios: {
          create: {
            nombre,
            email,
            googleId: hashedPassword ? null : googleId,
            password: hashedPassword || '',
            rol: 'ADMIN',
          },
        },
      },
      select: NEGOCIO_SAFE_SELECT,
    });
  },

  async findUsuarioByNegocioAndGoogleId(negocioId: number, googleId: string) {
    return prisma.usuario.findFirst({
      where: { negocioId, googleId },
      select: USUARIO_SAFE_SELECT,
    });
  },

  async findUsuarioById(id: number) {
    return prisma.usuario.findUnique({ where: { id }, select: USUARIO_SAFE_SELECT });
  },

  async findNegocioById(id: number) {
    return prisma.negocio.findUnique({ where: { id }, select: NEGOCIO_SAFE_SELECT });
  },

  async findUsuarioByEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  async findUsuarioByNegocioId(negocioId: number) {
    return prisma.usuario.findFirst({ where: { negocioId }, select: USUARIO_SAFE_SELECT });
  }
};
