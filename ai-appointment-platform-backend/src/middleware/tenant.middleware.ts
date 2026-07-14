import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../domain/errors';

/**
 * Inyecta req.negocioId desde el token ya verificado por verificarToken.
 * Debe usarse DESPUÉS de verificarToken.
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const negocioId = req.usuario?.negocioId;
  if (!negocioId) {
    next(new UnauthorizedError('No se pudo identificar el negocio.'));
    return;
  }
  req.negocioId = negocioId;
  next();
};
