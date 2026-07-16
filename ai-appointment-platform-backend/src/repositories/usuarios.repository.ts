import { prisma } from './prisma';

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
    const where = { usuarioNegocios: { some: { negocioId } } };
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

  async findByEmail(email: string): Promise<{
    id: number;
    email: string;
    password: string;
    rol: string;
    fotoPerfil: string | null;
  } | null> {
    return prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
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
      where: { id, usuarioNegocios: { some: { negocioId } } },
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });
  },

  async create(
    data: Omit<Parameters<typeof prisma.usuario.create>[0]['data'], 'usuarioNegocios'> & {
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
      return prisma.$transaction(async (tx) => {
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

    const usuario = await prisma.usuario.create({
      data: userData,
      select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
    });

    return usuario;
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

  async findFirstByGoogleId(googleId: string): Promise<{ id: number } | null> {
    return prisma.usuario.findFirst({
      where: { googleId },
      select: { id: true },
    });
  },
};
