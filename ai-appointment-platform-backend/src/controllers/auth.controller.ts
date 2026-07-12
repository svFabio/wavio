import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const loginConGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { googleToken } = req.body;
        const result = await authService.loginConGoogle(googleToken);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.usuario?.id;
        const negocioId = req.usuario?.negocioId;

        if (!userId || !negocioId) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const result = await authService.obtenerUsuarioActual(userId, negocioId);
        res.json({ usuario: result.usuario, negocio: result.negocio });
    } catch (error) {
        next(error);
    }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.usuario?.id;
        const negocioId = req.usuario?.negocioId;
        const { image } = req.body;

        if (!userId || !negocioId) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }

        const result = await authService.updateAvatar(userId, negocioId, image);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.usuario?.id;
        const negocioId = req.usuario?.negocioId;
        if (!userId || !negocioId) { res.status(401).json({ error: 'No autenticado' }); return; }
        const result = await authService.deleteAvatar(userId, negocioId);
        res.json(result);
    } catch (error) { next(error); }
};

export const updateNombre = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.usuario?.id;
        const negocioId = req.usuario?.negocioId;
        const { nombre } = req.body;
        if (!userId || !negocioId) { res.status(401).json({ error: 'No autenticado' }); return; }
        const result = await authService.updateNombre(userId, negocioId, nombre);
        res.json(result);
    } catch (error) { next(error); }
};

export const registrarConEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const result = await authService.registrarConEmail(email, password);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const loginConEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginConEmail(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// NOTE: Mobile polling endpoints left as-is for now (could also be extracted to service if needed)
export const googleMobileStart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ error: 'Not implemented in this refactor pass' });
};
export const googleMobileCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ error: 'Not implemented in this refactor pass' });
};
export const mobileTokenPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ error: 'Not implemented in this refactor pass' });
};
