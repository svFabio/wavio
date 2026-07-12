import { Request, Response, NextFunction } from 'express';
import * as negocioService from '../services/negocio.service';
import pino from 'pino';

const logger = pino();

export const configurarNegocio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const negocioId = req.negocioId!;
        const { nombre } = req.body;

        const negocio = await negocioService.configurarNegocio(negocioId, nombre);

        res.json({ success: true, negocio });
    } catch (error) {
        logger.error({ err: error }, '[Negocio] Error configurando negocio');
        next(error);
    }
};
