import { describe, it, expect, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  const payload = {
    id: 1,
    email: 'test@test.com',
    negocios: [
      { negocioId: 1, rol: 'ADMIN' },
      { negocioId: 2, rol: 'STAFF' },
    ],
    iat: 123,
    exp: 456,
  };

  it('should return id, email and negocios when payload is valid', () => {
    expect(strategy.validate(payload)).toEqual({
      id: 1,
      email: 'test@test.com',
      negocios: payload.negocios,
    });
  });

  it('should throw UnauthorizedException when id is missing', () => {
    expect(() => strategy.validate({ ...payload, id: undefined as never })).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when email is missing', () => {
    expect(() => strategy.validate({ ...payload, email: undefined as never })).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when negocios is missing', () => {
    const { negocios: _negocios, ...rest } = payload;

    expect(() => strategy.validate(rest as never)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when negocios is empty', () => {
    expect(() => strategy.validate({ ...payload, negocios: [] })).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException with correct message', () => {
    expect(() => strategy.validate({ ...payload, negocios: [] })).toThrow('Token inválido');
  });
});
