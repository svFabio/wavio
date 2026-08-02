import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    LOG_LEVEL: 'info',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GEMINI_API_KEY: 'test-gemini-key',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    META_WEBHOOK_VERIFY_TOKEN: 'test-verify-token',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
  },
}));

import { BadRequestException, HttpException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { AppError, NotFoundError } from '../../domain/errors';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockResponse: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  let mockRequest: { path: string; method: string };

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockRequest = { path: '/test', method: 'GET' };
    mockResponse = { status: mockStatus, json: mockJson };
    filter = new AllExceptionsFilter();
  });

  const createHost = (response?: unknown, request?: unknown) =>
    ({
      switchToHttp: () => ({
        getResponse: () => response ?? mockResponse,
        getRequest: () => request ?? mockRequest,
      }),
    }) as never;

  describe('AppError handling', () => {
    it('should return AppError status code and body', () => {
      const error = new NotFoundError('Cita');

      filter.catch(error, createHost());

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Cita not found',
        code: 'CITA_NOT_FOUND',
      });
    });

    it('should include errors property when present on AppError', () => {
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
      Object.assign(error, { errors: [{ field: 'name', message: 'required' }] });

      filter.catch(error, createHost());

      expect(mockJson).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'name', message: 'required' }],
      });
    });
  });

  describe('HttpException handling', () => {
    it('should handle NestJS HttpException with object response', () => {
      const error = new BadRequestException({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: [],
      });

      filter.catch(error, createHost());

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: [],
      });
    });

    it('should handle HttpException with string response', () => {
      const error = new HttpException('Not Found', 404);

      filter.catch(error, createHost());

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Not Found',
        code: 'HTTP_EXCEPTION',
      });
    });
  });

  describe('Unhandled exception handling', () => {
    it('should return 500 for unknown errors', () => {
      const error = new Error('Something broke');

      filter.catch(error, createHost());

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('should return 500 for non-Error values', () => {
      filter.catch('string error', createHost());

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });
});
