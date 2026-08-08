import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { JwtPayload } from '../utils/jwt';

export type TenantUser = JwtPayload & { rol: string; negocioId: number };

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.usuario as TenantUser | undefined;

    if (!user) {
      return false;
    }

    const negocioIdHeader = request.headers['x-negocio-id'] as string | undefined;
    if (!negocioIdHeader) {
      throw new BadRequestException('x-negocio-id header is required');
    }

    const negocioId = parseInt(negocioIdHeader, 10);
    if (isNaN(negocioId)) {
      throw new BadRequestException('x-negocio-id must be a number');
    }

    const negocios = user.negocios ?? [];
    const membership = negocios.find((n) => n.negocioId === negocioId);
    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }

    request.negocioId = negocioId;
    request.usuario.rol = membership.rol;
    request.usuario.negocioId = negocioId;

    return true;
  }
}
