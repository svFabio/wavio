import { prisma } from '../repositories/prisma';

export const usuariosRepository = {
    async findByNegocioId(negocioId: number) {
        return prisma.usuario.findMany({
            where: { negocioId },
            select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true },
            orderBy: { creadoEn: 'desc' }
        });
    },

    async findByEmail(email: string) {
        return prisma.usuario.findUnique({
            where: { email },
            select: { id: true, email: true, password: true, negocioId: true, rol: true, fotoPerfil: true }
        });
    },

    async findByIdAndNegocioId(id: number, negocioId: number) {
        return prisma.usuario.findFirst({
            where: { id, negocioId },
            select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true }
        });
    },

    async create(data: Parameters<typeof prisma.usuario.create>[0]['data']) {
        return prisma.usuario.create({
            data,
            select: { id: true, nombre: true, email: true, rol: true, creadoEn: true, fotoPerfil: true }
        });
    },

    async update(id: number, data: Parameters<typeof prisma.usuario.update>[0]['data']) {
        return prisma.usuario.update({
            where: { id },
            data,
            select: { id: true, nombre: true, email: true, rol: true, creadoEn: true }
        });
    },

    async delete(id: number): Promise<void> {
        await prisma.usuario.delete({ where: { id } });
    }
};
