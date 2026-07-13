import { Request, Response, NextFunction } from 'express';
import * as whatsappService from '../services/whatsapp.service';
import pino from 'pino';

const logger = pino();

export const saveWhatsappCredentials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await whatsappService.saveWhatsappCredentials(req.negocioId!, req.body);
        res.json(result);
    } catch (error) {
        logger.error({ err: error }, 'Error guardando credenciales de WhatsApp');
        next(error);
    }
};

export const getWhatsappStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const status = await whatsappService.getWhatsappStatus(req.negocioId!);
        res.json(status);
    } catch (error) {
        logger.error({ err: error }, 'Error obteniendo estado de WhatsApp');
        next(error);
    }
};

export const disconnectWhatsapp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await whatsappService.disconnectWhatsapp(req.negocioId!);
        res.json(result);
    } catch (error) {
        logger.error({ err: error }, 'Error desvinculando WhatsApp');
        next(error);
    }
};
