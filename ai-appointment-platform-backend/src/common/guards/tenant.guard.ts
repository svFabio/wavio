import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.usuario as JwtPayload | undefined;

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

    if (negocioId !== user.negocioId) {
      throw new ForbiddenException('You do not have access to this business');
    }

    request.negocioId = negocioId;

    return true;
  }
}
