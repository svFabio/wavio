import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../domain/errors';
import { createLogger } from '../../lib/logger';

const logger = createLogger('exception-filter');

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      const body: Record<string, unknown> = {
        error: exception.message,
        code: exception.code,
      };
      if ('errors' in exception) {
        body.errors = (exception as { errors: unknown }).errors;
      }
      response.status(exception.statusCode).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response
        .status(status)
        .json(typeof res === 'string' ? { error: res, code: 'HTTP_EXCEPTION' } : res);
      return;
    }

    logger.error(
      {
        err: exception,
        path: request.path,
        method: request.method,
      },
      'Unhandled exception',
    );

    response.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
