import { prisma } from '../repositories/prisma';
import { Negocio, Usuario } from '../domain/types';

type NegocioSafe = Omit<Negocio, 'waAccessToken'>;
type UsuarioSafe = Omit<Usuario, 'password'> & { fotoPerfil: string | null };

const NEGOCIO_SAFE_SELECT = {
  id: true,
  googleId: true,
  email: true,
  nombre: true,
  plan: true,
  waPhoneNumberId: true,
  waWabaId: true,
  waAppId: true,
  isWaConnected: true,
  creadoEn: true,
} as const;

const USUARIO_SAFE_SELECT = {
  id: true,
  nombre: true,
  email: true,
  googleId: true,
  rol: true,
  negocioId: true,
  creadoEn: true,
  fotoPerfil: true,
} as const;

export const authRepository = {
  async findNegocioByGoogleId(googleId: string): Promise<NegocioSafe | null> {
    return prisma.negocio.findUnique({ where: { googleId }, select: NEGOCIO_SAFE_SELECT });
  },

  async createNegocioWithAdmin(
    googleId: string,
    email: string,
    nombre: string,
    hashedPassword?: string,
  ): Promise<NegocioSafe> {
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

  async findUsuarioByNegocioAndGoogleId(
    negocioId: number,
    googleId: string,
  ): Promise<UsuarioSafe | null> {
    return prisma.usuario.findFirst({
      where: { negocioId, googleId },
      select: USUARIO_SAFE_SELECT,
    });
  },

  async findUsuarioById(id: number): Promise<UsuarioSafe | null> {
    return prisma.usuario.findUnique({ where: { id }, select: USUARIO_SAFE_SELECT });
  },

  async findNegocioById(id: number): Promise<NegocioSafe | null> {
    return prisma.negocio.findUnique({ where: { id }, select: NEGOCIO_SAFE_SELECT });
  },

  async findUsuarioByEmail(
    email: string,
  ): Promise<(Usuario & { fotoPerfil: string | null }) | null> {
    return prisma.usuario.findUnique({ where: { email } });
  },

  async findUsuarioByNegocioId(negocioId: number): Promise<UsuarioSafe | null> {
    return prisma.usuario.findFirst({ where: { negocioId }, select: USUARIO_SAFE_SELECT });
  },
};
