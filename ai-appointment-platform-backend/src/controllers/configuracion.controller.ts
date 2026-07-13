import { Request, Response, NextFunction } from 'express';
import { configuracionService } from '../services/configuracion.service';

export const getConfiguracion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await configuracionService.getConfiguracion(req.negocioId!);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateConfiguracion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await configuracionService.updateConfiguracion(req.negocioId!, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
