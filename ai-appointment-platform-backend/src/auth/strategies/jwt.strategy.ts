import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../config/env';
import type { JwtPayload } from '../../common/utils/jwt';

type JwtTokenPayload = JwtPayload & { iat: number; exp: number };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: JwtTokenPayload): JwtPayload {
    if (
      !payload.id ||
      !payload.email ||
      !Array.isArray(payload.negocios) ||
      payload.negocios.length === 0
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: payload.id,
      email: payload.email,
      negocios: payload.negocios,
    };
  }
}
