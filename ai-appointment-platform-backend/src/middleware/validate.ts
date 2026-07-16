import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationIssue {
  field: string;
  message: string;
}

export class StructuredValidationError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
  public readonly errors: ValidationIssue[];

  constructor(errors: ValidationIssue[]) {
    super('Validation failed');
    this.name = 'StructuredValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, StructuredValidationError.prototype);
  }
}

export const validateBody = (
  schema: ZodSchema,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationIssue[] = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new StructuredValidationError(errors));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (
  schema: ZodSchema,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Express 5 makes req.query a getter-only property — cannot reassign.
      // Store parsed result so downstream handlers read validated data.
      const parsed = schema.parse(req.query);
      req.validatedQuery = parsed as Record<string, unknown>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ValidationIssue[] = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new StructuredValidationError(errors));
      } else {
        next(error);
      }
    }
  };
};
