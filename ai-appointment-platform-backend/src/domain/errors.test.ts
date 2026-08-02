import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  WhatsAppError,
  ExternalServiceError,
} from './errors';

describe('AppError', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError('Something went wrong', 500, 'INTERNAL');

    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL');
    expect(error.name).toBe('AppError');
  });

  it('should be an instance of Error', () => {
    const error = new AppError('test', 400, 'TEST');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  it('should create with resource name in message', () => {
    const error = new NotFoundError('Cita');

    expect(error.message).toBe('Cita not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('CITA_NOT_FOUND');
    expect(error.name).toBe('NotFoundError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should uppercase resource in code', () => {
    const error = new NotFoundError('Usuario');

    expect(error.code).toBe('USUARIO_NOT_FOUND');
  });
});

describe('ValidationError', () => {
  it('should create with custom message', () => {
    const error = new ValidationError('Invalid email format');

    expect(error.message).toBe('Invalid email format');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ValidationError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('UnauthorizedError', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.name).toBe('UnauthorizedError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create with custom message', () => {
    const error = new UnauthorizedError('Invalid token');

    expect(error.message).toBe('Invalid token');
  });
});

describe('ForbiddenError', () => {
  it('should create with default message', () => {
    const error = new ForbiddenError();

    expect(error.message).toBe('Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.name).toBe('ForbiddenError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create with custom message', () => {
    const error = new ForbiddenError('Access denied');

    expect(error.message).toBe('Access denied');
  });
});

describe('ConflictError', () => {
  it('should create with custom message', () => {
    const error = new ConflictError('Email already exists');

    expect(error.message).toBe('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.name).toBe('ConflictError');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('WhatsAppError', () => {
  it('should create with default status 502', () => {
    const error = new WhatsAppError('WhatsApp not configured');

    expect(error.message).toBe('WhatsApp not configured');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('WHATSAPP_ERROR');
    expect(error.name).toBe('WhatsAppError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create with custom status code', () => {
    const error = new WhatsAppError('Rate limited', 429);

    expect(error.statusCode).toBe(429);
  });
});

describe('ExternalServiceError', () => {
  it('should create with default code and status', () => {
    const error = new ExternalServiceError('Service unavailable');

    expect(error.message).toBe('Service unavailable');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(error.name).toBe('ExternalServiceError');
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create with custom code and status', () => {
    const error = new ExternalServiceError('Stripe error', 'STRIPE_ERROR', 503);

    expect(error.code).toBe('STRIPE_ERROR');
    expect(error.statusCode).toBe(503);
  });
});
