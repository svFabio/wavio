import { prisma } from '../repositories/prisma';

export const usuariosRepository = {
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
    const where = { negocioId };
    const [data, total] = await Promise.all([
      prisma.usuario.findMany({
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
      prisma.usuario.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async findByEmail(
    email: string,
  ): Promise<{
    id: number;
    email: string;
    password: string;
    negocioId: number;
    rol: string;
    fotoPerfil: string | null;
  } | null> {
    return prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        negocioId: true,
        rol: true,
        fotoPerfil: true,
      },
    });
  },

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
    return prisma.usuario.findFirst({
      where: { id, negocioId },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });
  },

  async create(
    data: Parameters<typeof prisma.usuario.create>[0]['data'],
  ): Promise<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
    creadoEn: Date;
    fotoPerfil: string | null;
  }> {
    return prisma.usuario.create({
      data,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });
  },

  async update(
    id: number,
    data: Parameters<typeof prisma.usuario.update>[0]['data'],
  ): Promise<{ id: number; nombre: string; email: string; rol: string; creadoEn: Date }> {
    return prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true },
    });
  },

  async delete(id: number): Promise<void> {
    await prisma.usuario.delete({ where: { id } });
  },
};
