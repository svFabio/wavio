import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const saveWhatsappCredentials = async (req: Request, res: Response) => {
    try {
        const { waAccessToken, waPhoneNumberId, waWabaId } = req.body;
        const negocioId = req.negocioId; // Viene del tokenMiddleware

        if (!waAccessToken || !waPhoneNumberId || !waWabaId) {
            return res.status(400).json({ error: 'Faltan credenciales de Meta' });
        }

        const negocio = await prisma.negocio.update({
            where: { id: negocioId },
            data: {
                waAccessToken,
                waPhoneNumberId,
                waWabaId,
                isWaConnected: true,
            }
        });

        res.json({ success: true, message: 'WhatsApp vinculado correctamente.', negocio });
    } catch (error) {
        console.error('Error guardando credenciales de WhatsApp:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getWhatsappStatus = async (req: Request, res: Response) => {
    try {
        const negocioId = req.negocioId;
        const negocio = await prisma.negocio.findUnique({
            where: { id: negocioId }
        });

        if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

        res.json({ 
            conectado: negocio.isWaConnected,
            phoneNumberId: negocio.waPhoneNumberId,
            wabaId: negocio.waWabaId
        });
    } catch (error) {
        console.error('Error obteniendo estado de WhatsApp:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const disconnectWhatsapp = async (req: Request, res: Response) => {
    try {
        const negocioId = req.negocioId;
        
        await prisma.negocio.update({
            where: { id: negocioId },
            data: {
                waAccessToken: null,
                waPhoneNumberId: null,
                waWabaId: null,
                isWaConnected: false,
            }
        });

        res.json({ success: true, message: 'WhatsApp desvinculado correctamente.' });
    } catch (error) {
        console.error('Error desvinculando WhatsApp:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
