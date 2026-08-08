import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  id: number;
  email: string;
  negocios: Array<{ negocioId: number; rol: string }>;
}

const JWT_SECRET = env.JWT_SECRET;

/**
 * Verify JWT token manually. Used by EventsGateway (Socket.IO) which cannot
 * use Passport guards — WebSocket connections don't go through the HTTP
 * middleware pipeline. For HTTP endpoints, use JwtAuthGuard + JwtStrategy instead.
 */
export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
