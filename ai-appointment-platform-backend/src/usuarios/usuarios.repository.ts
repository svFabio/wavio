import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const [records, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          creadoEn: true,
          fotoPerfil: true,
          usuarioNegocios: {
            where: { negocioId },
            select: { rol: true },
          },
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    const data = records.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.usuarioNegocios?.[0]?.rol ?? 'STAFF',
      creadoEn: u.creadoEn,
      fotoPerfil: u.fotoPerfil,
    }));

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
    const record = await this.prisma.usuario.findFirst({
      where: { id, usuarioNegocios: { some: { negocioId } } },
      select: {
        id: true,
        nombre: true,
        email: true,
        creadoEn: true,
        fotoPerfil: true,
        usuarioNegocios: {
          where: { negocioId },
          select: { rol: true },
        },
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      nombre: record.nombre,
      email: record.email,
      rol: record.usuarioNegocios?.[0]?.rol ?? 'STAFF',
      creadoEn: record.creadoEn,
      fotoPerfil: record.fotoPerfil,
    };
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

  async deleteMembership(negocioId: number, usuarioId: number): Promise<void> {
    await this.prisma.usuarioNegocio.delete({
      where: {
        usuarioId_negocioId: {
          usuarioId,
          negocioId,
        },
      },
    });
  }

  async countFutureCitasByStaff(negocioId: number, staffId: number): Promise<number> {
    return this.prisma.cita.count({
      where: {
        negocioId,
        staffId,
        fecha: { gte: new Date() },
        estado: { notIn: ['CANCELADA'] },
      },
    });
  }

  async updateMembershipRole(usuarioId: number, negocioId: number, rol: string): Promise<void> {
    await this.prisma.usuarioNegocio.update({
      where: {
        usuarioId_negocioId: {
          usuarioId,
          negocioId,
        },
      },
      data: {
        rol: rol as never,
      },
    });
  }

  async findFirstByGoogleId(googleId: string): Promise<{ id: number } | null> {
    return this.prisma.usuario.findFirst({
      where: { googleId },
      select: { id: true },
    });
  }

  async countAdminsByNegocio(negocioId: number): Promise<number> {
    return this.prisma.usuario.count({
      where: {
        rol: { in: ['ADMIN', 'OWNER'] },
        usuarioNegocios: { some: { negocioId } },
      },
    });
  }
}
