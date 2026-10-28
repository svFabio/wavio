import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import type { JwtPayload } from '../utils/jwt';

export type TenantUser = JwtPayload & { rol: string; negocioId: number };

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = (request.usuario ?? request.user) as TenantUser | undefined;

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

    let rol: string;
    try {
      rol = await this.authService.verifyTenantMembership(user.id, negocioId);
    } catch {
      throw new ForbiddenException('No tienes acceso a este negocio');
    }

    request.negocioId = negocioId;
    if (request.usuario) {
      request.usuario.rol = rol;
      request.usuario.negocioId = negocioId;
    }
    if (request.user) {
      request.user.rol = rol;
      request.user.negocioId = negocioId;
    }

    return true;
  }
}
