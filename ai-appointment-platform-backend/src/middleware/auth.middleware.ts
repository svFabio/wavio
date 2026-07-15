import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../domain/errors';

export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

const JWT_SECRET = env.JWT_SECRET;

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

// Extender el tipo Request de Express para incluir usuario
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
      negocioId?: number; // Inyectado por tenantMiddleware
      negocioRole?: string; // Inyectado por tenantMiddleware
    }
  }
}

export const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    next(new UnauthorizedError('Acceso denegado. Token requerido.'));
    return;
  }

  try {
    req.usuario = verifyJwt(token);
    next();
  } catch (error) {
    next(new UnauthorizedError('Token inválido o expirado.'));
  }
};
