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
  rol: string;
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

  private signToken(
    user: { id: number; email: string },
    negocios: Array<{ negocioId: number; rol: string }>,
  ): string {
    return jwt.sign({ id: user.id, email: user.email, negocios }, env.JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  async loginConGoogle(googleToken: string): Promise<{
    token: string;
    usuario: UsuarioSafe;
    negocios: NegocioSafe[];
    esNuevo: boolean;
  }> {
    let googleId: string;
    let email: string;
    let nombre: string;

    const segments = googleToken.split('.');
    if (segments.length !== 3) {
      throw new UnauthorizedError('Token de Google inválido. Se requiere un ID token.');
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedError(
        'No se pudo verificar el token de Google. Asegúrate de que el Client ID de Google sea el mismo en frontend y backend.',
      );
    }
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedError('Token de Google inválido');
    }
    googleId = payload.sub;
    email = payload.email;
    nombre = payload.name || email.split('@')[0];

    let negocio = await this.authRepository.findNegocioByGoogleId(googleId);
    let esNuevo = false;

    if (!negocio) {
      negocio = await this.authRepository.findNegocioByEmail(email);
      if (negocio) {
        await this.authRepository.updateNegocioGoogleId(negocio.id, googleId);
      } else {
        negocio = await this.authRepository.createNegocioWithAdmin(googleId, email, nombre);
        esNuevo = true;
      }
    }

    let usuario = await this.authRepository.findUsuarioByNegocioAndGoogleId(negocio.id, googleId);
    if (!usuario) {
      usuario = await this.authRepository.findUsuarioByNegocioAndEmail(negocio.id, email);
      if (usuario) {
        await this.authRepository.updateUsuarioGoogleId(usuario.id, googleId);
      } else {
        const existingUser = await this.authRepository.findFirstByGoogleId(googleId);
        if (existingUser) {
          const membership = await this.authRepository.findUsuarioNegocioMembership(
            existingUser.id,
            negocio.id,
          );
          if (membership) {
            usuario = await this.authRepository.findUsuarioById(existingUser.id);
          }
        }
        if (!usuario) {
          throw new NotFoundError('Usuario del negocio');
        }
      }
    }

    const negocios = await this.authRepository.findNegociosByUsuarioId(usuario.id);

    const memberships = negocios.map((n) => ({ negocioId: n.id, rol: n.rol }));
    const token = this.signToken({ id: usuario.id, email: usuario.email }, memberships);

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

    const negocios = await this.authRepository.findNegociosByUsuarioId(usuario.id);

    const memberships = negocios.map((n) => ({ negocioId: n.id, rol: n.rol }));
    const token = this.signToken({ id: usuario.id, email: usuario.email }, memberships);

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

    const memberships = negocios.map((n) => ({ negocioId: n.id, rol: n.rol }));
    const token = this.signToken({ id: usuario.id, email: usuario.email }, memberships);

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
    negocioIdHeader?: string,
  ): Promise<{ usuario: UsuarioSafe; negocios: NegocioSafe[] }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const negocios = await this.authRepository.findNegociosByUsuarioId(userId);
    if (negocios.length === 0) {
      throw new NotFoundError('Negocio');
    }

    const activo = this.resolveActiveNegocio(negocios, negocioIdHeader);
    usuario.rol = activo.rol;

    return { usuario, negocios };
  }

  private resolveActiveNegocio(negocios: NegocioSafe[], negocioIdHeader?: string): NegocioSafe {
    const parsed = negocioIdHeader ? Number(negocioIdHeader) : NaN;
    const match = negocios.find((n) => n.id === parsed);
    return match ?? negocios[0];
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

    const membership = await this.authRepository.findUsuarioNegocioMembership(userId, negocioId);
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    const fotoPerfil = await uploadBase64Image(base64Image, `wavio/users/${userId}`);
    await this.authRepository.updateUsuario(userId, { fotoPerfil });

    return { fotoPerfil };
  }

  async deleteAvatar(userId: number, negocioId: number): Promise<{ success: boolean }> {
    const usuario = await this.authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await this.authRepository.findUsuarioNegocioMembership(userId, negocioId);
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

    const membership = await this.authRepository.findUsuarioNegocioMembership(userId, negocioId);
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    const updated = await this.authRepository.updateUsuario(userId, {
      nombre: nombre.trim(),
    });
    return { nombre: updated.nombre };
  }

  /**
   * Cambia la contraseña del usuario autenticado.
   * Si el usuario aún no tiene contraseña ('' — p.ej. staff invitado que aún no
   * la estableció), permite fijar la nueva directamente sin `passwordActual`.
   */
  async cambiarPassword(
    userId: number,
    passwordActual: string | undefined,
    passwordNueva: string,
  ): Promise<{ ok: boolean }> {
    const usuario = await this.authRepository.findUsuarioByIdWithPassword(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    if (usuario.password) {
      const valida = await bcrypt.compare(passwordActual ?? '', usuario.password);
      if (!valida) {
        throw new UnauthorizedError('La contraseña actual es incorrecta');
      }
    }

    const hashedPassword = await bcrypt.hash(passwordNueva, BCRYPT_SALT_ROUNDS);
    await this.authRepository.updatePassword(userId, hashedPassword);

    return { ok: true };
  }

  /**
   * Reset de contraseña por email (superficie de contrato).
   * TODO: sin un canal de email/WhatsApp no podemos entregar un token de reset,
   * así que NO se genera nada y se responde { ok: true } SIEMPRE para evitar
   * enumeración de usuarios. Implementar el delivery real cuando exista el canal.
   */
  async resetPassword(_email: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
