import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NEGOCIO_SAFE_SELECT } from '../repositories/negocio-select';

type NegocioSafe = {
  id: number;
  googleId: string;
  email: string;
  nombre: string;
  plan: string;
  waPhoneNumberId: string | null;
  waWabaId: string | null;
  waAppId: string | null;
  isWaConnected: boolean;
  creadoEn: Date;
};

type UsuarioSafe = {
  id: number;
  nombre: string;
  email: string;
  googleId: string | null;
  rol: string;
  creadoEn: Date;
  fotoPerfil: string | null;
};

const USUARIO_SAFE_SELECT = {
  id: true,
  nombre: true,
  email: true,
  googleId: true,
  rol: true,
  creadoEn: true,
  fotoPerfil: true,
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNegocioByGoogleId(googleId: string): Promise<NegocioSafe | null> {
    return this.prisma.negocio.findUnique({
      where: { googleId },
      select: NEGOCIO_SAFE_SELECT,
    });
  }

  async createNegocioWithAdmin(
    googleId: string,
    email: string,
    nombre: string,
    hashedPassword?: string,
  ): Promise<NegocioSafe> {
    const [negocio, usuario] = await this.prisma.$transaction([
      this.prisma.negocio.create({
        data: { googleId, email, nombre },
        select: NEGOCIO_SAFE_SELECT,
      }),
      this.prisma.usuario.create({
        data: {
          nombre,
          email,
          googleId: hashedPassword ? null : googleId,
          password: hashedPassword || '',
          rol: 'ADMIN',
        },
      }),
    ]);

    await this.prisma.usuarioNegocio.create({
      data: {
        usuarioId: usuario.id,
        negocioId: negocio.id,
        rol: 'ADMIN',
      },
    });

    return negocio;
  }

  async findUsuarioByNegocioAndGoogleId(
    negocioId: number,
    googleId: string,
  ): Promise<UsuarioSafe | null> {
    return this.prisma.usuario.findFirst({
      where: {
        googleId,
        usuarioNegocios: { some: { negocioId } },
      },
      select: USUARIO_SAFE_SELECT,
    });
  }

  async findUsuarioById(id: number): Promise<UsuarioSafe | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: USUARIO_SAFE_SELECT,
    });
  }

  async findUsuarioByEmail(
    email: string,
  ): Promise<(UsuarioSafe & { password: string | null }) | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async findUsuarioByNegocioId(negocioId: number): Promise<UsuarioSafe | null> {
    return this.prisma.usuario.findFirst({
      where: { usuarioNegocios: { some: { negocioId } } },
      select: USUARIO_SAFE_SELECT,
    });
  }

  async findNegociosByUsuarioId(usuarioId: number): Promise<NegocioSafe[]> {
    const memberships = await this.prisma.usuarioNegocio.findMany({
      where: { usuarioId },
      select: { negocio: { select: NEGOCIO_SAFE_SELECT } },
    });
    return memberships.map((m) => m.negocio);
  }

  async findFirstByGoogleId(googleId: string): Promise<{ id: number } | null> {
    return this.prisma.usuario.findFirst({
      where: { googleId },
      select: { id: true },
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
      create: { usuarioId, negocioId, rol: rol as 'ADMIN' | 'STAFF' },
    });
  }

  async findUsuarioNegocioMembership(
    usuarioId: number,
    negocioId: number,
  ): Promise<{ usuarioId: number; negocioId: number; rol: string } | null> {
    return this.prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId, negocioId } },
    });
  }

  async updateUsuario(
    id: number,
    data: { fotoPerfil?: string | null; nombre?: string },
  ): Promise<{ id: number; nombre: string; email: string; rol: string; creadoEn: Date }> {
    return this.prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
    });
  }
}
