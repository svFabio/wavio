import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../domain/errors';

export const validateBody = (schema: ZodSchema): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(`Invalid request body: ${issues}`));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(`Invalid request query: ${issues}`));
      } else {
        next(error);
      }
    }
  };
};
