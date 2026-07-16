import { Request } from 'express';

declare module 'express' {
  interface Request {
    validatedQuery?: Record<string, unknown>;
    negocioId?: number;
  }
}
