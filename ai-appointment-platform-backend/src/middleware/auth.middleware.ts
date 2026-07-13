import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;
// Extender el tipo Request de Express para incluir usuario con negocioId
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            usuario?: {
                id: number;
                email: string;
                rol: string;
                negocioId: number;
            };
            negocioId?: number; // Inyectado por tenantMiddleware
        }
    }
}

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: number;
            email: string;
            rol: string;
            negocioId: number;
        };
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};
