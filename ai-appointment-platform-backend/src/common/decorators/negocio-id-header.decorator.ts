import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Reads the optional `x-negocio-id` request header.
 * Unlike `TenantId`, this never requires a resolved tenant: it returns
 * `undefined` when the header is absent, so endpoints like `GET /auth/me`
 * can fall back to the user's first membership.
 */
export const NegocioIdHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-negocio-id'] as string | undefined;
  },
);
