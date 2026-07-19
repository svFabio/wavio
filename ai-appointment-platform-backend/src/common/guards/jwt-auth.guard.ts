import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Token inválido o expirado');
    }
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    request.usuario = user;
    return user;
  }
}
