import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../domain/errors';

/**
 * Middleware simple de rol — requiere que req.usuario ya esté poblado
 * por verificarToken. Se usa DESPUÉS de verificarToken y tenantMiddleware.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.usuario?.rol !== 'ADMIN') {
    next(new ForbiddenError('Acceso denegado. Se requieren permisos de administrador.'));
    return;
  }
  next();
};
