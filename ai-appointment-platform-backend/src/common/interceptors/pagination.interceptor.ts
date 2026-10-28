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

        // If the handler returns { data, total, page, limit, totalPages } (e.g. ClientesService)
        if (response && typeof response === 'object' && 'data' in response && 'total' in response) {
          const resp = response as {
            data: unknown[];
            total: number;
            page?: number;
            limit?: number;
            totalPages?: number;
          };
          const p = resp.page ?? page;
          const l = resp.limit ?? limit;
          const t = resp.total ?? 0;
          const totalPages = resp.totalPages ?? (t && l ? Math.ceil(t / l) : 0);
          return {
            data: resp.data ?? [],
            pagination: {
              page: p,
              limit: l,
              total: t,
              totalPages,
            },
          };
        }

        // Otherwise wrap array or other raw response
        const total = (request as Record<string, unknown>)._total as number | undefined;
        const totalNum = typeof total === 'number' && !isNaN(total) ? total : 0;
        const totalPages = totalNum > 0 ? Math.ceil(totalNum / limit) : 0;
        return {
          data: response ?? [],
          pagination: {
            page,
            limit,
            total: totalNum,
            totalPages,
          },
        };
      }),
    );
  }
}
