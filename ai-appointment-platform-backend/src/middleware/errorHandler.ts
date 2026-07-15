import { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/errors';
import { StructuredValidationError } from './validate';
import pino from 'pino';

const logger = pino();

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof StructuredValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Si no es un AppError, es un error inesperado
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
    },
    'Unhandled exception',
  );

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  });
};
