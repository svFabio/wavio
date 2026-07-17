import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  id: number;
  email: string;
  negocioId: number;
  rol: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.usuario;
  },
);
