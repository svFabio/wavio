import { Request, Response, NextFunction } from 'express';
import * as statisticsService from '../services/statistics.service';
import pino from 'pino';

const logger = pino();

export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const negocioId = req.negocioId!;
    const overview = await statisticsService.getOverview(negocioId);
    res.json(overview);
  } catch (error) {
    logger.error({ err: error }, 'Error en overview');
    next(error);
  }
};

export const getRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const negocioId = req.negocioId!;
    const months = parseInt(req.query.months as string) || 6;
    const revenue = await statisticsService.getRevenue(negocioId, months);
    res.json(revenue);
  } catch (error) {
    logger.error({ err: error }, 'Error en revenue');
    next(error);
  }
};
