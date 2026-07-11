import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const configurarNegocio = async (req: Request, res: Response) => {
    try {
        const negocioId = req.negocioId!;
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
            return res.status(400).json({ error: 'El nombre del negocio es inválido' });
        }

        const negocio = await prisma.negocio.update({
            where: { id: negocioId },
            data: { nombre: nombre.trim() }
        });

        res.json({ success: true, negocio });
    } catch (error) {
        console.error('[Negocio] Error configurando negocio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
