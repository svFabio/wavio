import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { PaginationParams } from '../decorators/pagination.decorator';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<PaginatedResponse<unknown>> {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    const page = Math.max(1, parseInt(String(query?.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query?.limit)) || 20));
    const skip = (page - 1) * limit;

    const pagination: PaginationParams = { page, limit, skip };
    request.pagination = pagination;

    return next.handle().pipe(
      map((response) => {
        // If the handler already returns a paginated shape, pass through
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'pagination' in response
        ) {
          return response;
        }

        // Otherwise wrap — caller must have attached _total on request
        const total = (request as Record<string, unknown>)._total as number | undefined;
        return {
          data: response ?? [],
          pagination: {
            page,
            limit,
            total: total ?? 0,
            totalPages: total ? Math.ceil(total / limit) : 0,
          },
        };
      }),
    );
  }
}
