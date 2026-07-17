import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

const JWT_SECRET = env.JWT_SECRET;

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
