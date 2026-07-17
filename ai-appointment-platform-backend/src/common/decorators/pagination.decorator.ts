import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginationParams => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const page = Math.max(1, parseInt(String(query?.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query?.limit)) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  },
);
