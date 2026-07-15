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
    const negocio = await prisma.negocio.create({
      data: {
        googleId,
        email,
        nombre,
      },
      select: NEGOCIO_SAFE_SELECT,
    });

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        googleId: hashedPassword ? null : googleId,
        password: hashedPassword || '',
        rol: 'ADMIN',
      },
    });

    await prisma.usuarioNegocio.create({
      data: {
        usuarioId: usuario.id,
        negocioId: negocio.id,
        rol: 'ADMIN',
      },
    });

    return negocio;
  },

  async findUsuarioByNegocioAndGoogleId(
    negocioId: number,
    googleId: string,
  ): Promise<UsuarioSafe | null> {
    return prisma.usuario.findFirst({
      where: {
        googleId,
        usuarioNegocios: { some: { negocioId } },
      },
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
    return prisma.usuario.findFirst({
      where: { usuarioNegocios: { some: { negocioId } } },
      select: USUARIO_SAFE_SELECT,
    });
  },

  async findNegociosByUsuarioId(usuarioId: number): Promise<NegocioSafe[]> {
    const memberships = await prisma.usuarioNegocio.findMany({
      where: { usuarioId },
      select: { negocio: { select: NEGOCIO_SAFE_SELECT } },
    });
    return memberships.map((m) => m.negocio);
  },

  async findUsuarioByEmailAndNegocioId(
    email: string,
    negocioId: number,
  ): Promise<UsuarioSafe | null> {
    return prisma.usuario.findFirst({
      where: {
        email,
        usuarioNegocios: { some: { negocioId } },
      },
      select: USUARIO_SAFE_SELECT,
    });
  },
};
