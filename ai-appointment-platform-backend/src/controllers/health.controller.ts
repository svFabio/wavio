import { Request, Response } from 'express';
import { healthService } from '../services/health.service';

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  const result = await healthService.check();
  const statusCode = result.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(result);
};
