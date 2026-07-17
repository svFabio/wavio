import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByNegocioId(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Array<{
      id: number;
      nombre: string;
      email: string;
      rol: string;
      creadoEn: Date;
      fotoPerfil: string | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const where = { usuarioNegocios: { some: { negocioId } } };
    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          creadoEn: true,
          fotoPerfil: true,
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findByEmail(email: string): Promise<{
    id: number;
    email: string;
    password: string;
    rol: string;
    fotoPerfil: string | null;
  } | null> {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        rol: true,
        fotoPerfil: true,
      },
    });
  }

  async findByIdAndNegocioId(
    id: number,
    negocioId: number,
  ): Promise<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
    creadoEn: Date;
    fotoPerfil: string | null;
  } | null> {
    return this.prisma.usuario.findFirst({
      where: { id, usuarioNegocios: { some: { negocioId } } },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });
  }

  async create(
    data: Omit<Prisma.UsuarioCreateInput, 'usuarioNegocios'> & {
      negocioId?: number;
    },
  ): Promise<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
    creadoEn: Date;
    fotoPerfil: string | null;
  }> {
    const { negocioId, ...userData } = data;

    if (negocioId) {
      return this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: userData,
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            creadoEn: true,
            fotoPerfil: true,
          },
        });

        await tx.usuarioNegocio.create({
          data: {
            usuarioId: usuario.id,
            negocioId,
            rol: userData.rol || 'STAFF',
          },
        });

        return usuario;
      });
    }

    const usuario = await this.prisma.usuario.create({
      data: userData,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });

    return usuario;
  }

  async update(
    id: number,
    data: Prisma.UsuarioUpdateInput,
  ): Promise<{ id: number; nombre: string; email: string; rol: string; creadoEn: Date }> {
    return this.prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }

  async findFirstByGoogleId(googleId: string): Promise<{ id: number } | null> {
    return this.prisma.usuario.findFirst({
      where: { googleId },
      select: { id: true },
    });
  }
}

// Backward-compatible singleton for Express routes
export const usuariosRepository = new UsuariosRepository(prisma as never);
