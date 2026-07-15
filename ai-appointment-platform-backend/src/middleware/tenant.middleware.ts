import { Request, Response, NextFunction } from 'express';
import { prisma } from '../repositories/prisma';
import { AppError } from '../domain/errors';

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const negocioIdStr = req.headers['x-negocio-id'] as string | undefined;
    if (!negocioIdStr) {
      throw new AppError('x-negocio-id header is required', 400, 'MISSING_TENANT');
    }
    const negocioId = parseInt(negocioIdStr, 10);
    if (isNaN(negocioId)) {
      throw new AppError('x-negocio-id must be a number', 400, 'INVALID_TENANT');
    }
    const membership = await prisma.usuarioNegocio.findUnique({
      where: { usuarioId_negocioId: { usuarioId: req.usuario!.id, negocioId } },
    });
    if (!membership) {
      throw new AppError('You do not have access to this business', 403, 'TENANT_DENIED');
    }
    req.negocioId = negocioId;
    (req as any).negocioRole = membership.rol;
    next();
  } catch (error) {
    next(error);
  }
};
