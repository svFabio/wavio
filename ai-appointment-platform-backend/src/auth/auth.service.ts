import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from '../config';
import { UnauthorizedError, ConflictError, NotFoundError } from '../domain/errors';
import { AuthRepository } from './auth.repository';
import { uploadBase64Image } from '../lib/cloudinary';

type NegocioSafe = {
  id: number;
  googleId: string;
  email: string;
  nombre: string;
  plan: string;
  waPhoneNumberId: string | null;
  waWabaId: string | null;
  waAppId: string | null;
  isWaConnected: boolean;
  creadoEn: Date;
};

type UsuarioSafe = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  fotoPerfil: string | null;
  creadoEn: Date;
};

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(private readonly authRepository: AuthRepository) {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  private signToken(user: {
    id: number;
    email: string;
    negocioId: number;
    rol: string;
  }): string {
    return jwt.sign(
      { id: user.id, email: user.email, negocioId: user.negocioId, rol: user.rol },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }

  async loginConGoogle(
    googleToken: string,
  ): Promise<{
    token: string;
    usuario: UsuarioSafe;
    negocios: NegocioSafe[];
    esNuevo: boolean;
  }> {
    let googleId: string;
    let email: string;
    let nombre: string;

    const segments = googleToken.split('.');
    if (segments.length === 3) {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedError('Token de Google inválido');
      }
      googleId = payload.sub;
      email = payload.email;
      nombre = payload.name || email.split('@')[0];
    } else {
      const verifyRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!verifyRes.ok) {
        throw new UnauthorizedError('Token de Google inválido');
      }
      const verified = (await verifyRes.json()) as { sub?: string; email?: string; name?: string };
      if (!verified.sub || !verified.email) {
        throw new UnauthorizedError('Token de Google inválido');
      }
      googleId = verified.sub;
      email = verified.email;
      nombre = verified.name || email.split('@')[0];
    }

    let negocio = await this.authRepository.findNegocioByGoogleId(googleId);
    const esNuevo = !negocio;

    if (!negocio) {
      negocio = await this.authRepository.createNegocioWithAdmin(googleId, email, nombre);
    }

    let usuario = await this.authRepository.findUsuarioByNegocioAndGoogleId(
      negocio.id,
      googleId,
    );
    if (!usuario) {
      const existingUser = await this.authRepository.findFirstByGoogleId(googleId);
      if (existingUser) {
        await this.authRepository.upsertMembership(existingUser.id, negocio.id, 'ADMIN');
        usuario = await this.authRepository.findUsuarioById(existingUser.id);
      }
      if (!usuario) {
        throw new NotFoundError('Usuario del negocio');
      }
    }

    const negocios = await this.authRepository.findNegociosByUsuarioId(usuario.id);

    const token = this.signToken({
      id: usuario.id,
      email: usuario.email,
      negocioId: negocios[0]?.id ?? negocio.id,
      rol: usuario.rol,
    });

    return { token, usuario, negocios, esNuevo };
  }

  async registrarConEmail(
    email: string,
    password: string,
  ): Promise<{
    token: string;
    usuario: UsuarioSafe;
    negocios: NegocioSafe[];
    esNuevo: boolean;
  }> {
    const existente = await this.authRepository.findUsuarioByEmail(email);
    if (existente) {
      throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const nombre = email.split('@')[0];

    const negocio = await this.authRepository.createNegocioWithAdmin(
      `email-${email}`,
      email,
      'Mi Negocio',
      hashedPassword,
    );

    const usuario = await this.authRepository.findUsuarioByNegocioId(negocio.id);
    if (!usuario) {
      throw new NotFoundError('Usuario recién creado');
    }

    const token = this.signToken({
      id: usuario.id,
      email: usuario.email,
      negocioId: negocio.id,
      rol: usuario.rol,
    });

    const negocios = await this.authRepository.findNegociosByUsuarioId(usuario.id);

    return { token, usuario, negocios, esNuevo: true };
  }

  async loginConEmail(
    email: string,
    password: string,
  ): Promise<{
    token: string;
    usuario: Pick<UsuarioSafe, 'id' | 'nombre' | 'email' | 'rol' | 'creadoEn'>;
    negocios: NegocioSafe[];
    esNuevo: boolean;
  }> {
    const usuario = await this.authRepository.findUsuarioByEmail(email);
    if (!usuario || !usuario.password) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const negocios = await this.authRepository.findNegociosByUsuarioId(usuario.id);
    if (negocios.length === 0) {
      throw new NotFoundError('Negocio');
    }

    const token = this.signToken({
      id: usuario.id,
      email: usuario.email,
      negocioId: negocios[0].id,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        creadoEn: usuario.creadoEn,
      },
      negocios,
      esNuevo: false,
    };
  }

  async obtenerUsuarioActual(
    userId: number,
  ): Promise<{ usuario: UsuarioSafe; negocios: NegocioSafe[] }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const negocios = await this.authRepository.findNegociosByUsuarioId(userId);
    if (negocios.length === 0) {
      throw new NotFoundError('Negocio');
    }

    return { usuario, negocios };
  }

  async updateAvatar(
    userId: number,
    negocioId: number,
    base64Image: string,
  ): Promise<{ fotoPerfil: string }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await this.authRepository.findUsuarioNegocioMembership(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    const fotoPerfil = await uploadBase64Image(base64Image, `wavio/users/${userId}`);
    await this.authRepository.updateUsuario(userId, { fotoPerfil });

    return { fotoPerfil };
  }

  async deleteAvatar(
    userId: number,
    negocioId: number,
  ): Promise<{ success: boolean }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await this.authRepository.findUsuarioNegocioMembership(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    await this.authRepository.updateUsuario(userId, { fotoPerfil: null });
    return { success: true };
  }

  async updateNombre(
    userId: number,
    negocioId: number,
    nombre: string,
  ): Promise<{ nombre: string }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await this.authRepository.findUsuarioNegocioMembership(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    const updated = await this.authRepository.updateUsuario(userId, {
      nombre: nombre.trim(),
    });
    return { nombre: updated.nombre };
  }
}
