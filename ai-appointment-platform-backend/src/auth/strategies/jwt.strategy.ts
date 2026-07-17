import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../config/env';

interface JwtTokenPayload {
  id: number;
  email: string;
  negocioId: number;
  rol: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: JwtTokenPayload): { id: number; email: string; negocioId: number; rol: string } {
    if (!payload.id || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: payload.id,
      email: payload.email,
      negocioId: payload.negocioId,
      rol: payload.rol,
    };
  }
}
