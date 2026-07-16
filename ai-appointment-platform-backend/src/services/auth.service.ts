import { authRepository } from '../repositories/auth.repository';
import { UnauthorizedError, ConflictError, NotFoundError } from '../domain/errors';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from '../config';
import { Usuario, Negocio } from '../domain/types';
import { usuariosRepository } from '../repositories/usuarios.repository';
import { usuarioNegocioRepository } from '../repositories/usuarioNegocio.repository';
import { uploadBase64Image } from '../lib/cloudinary';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

type NegocioSafe = Omit<Negocio, 'waAccessToken'>;
type UsuarioSafe = Omit<Usuario, 'password'> & { fotoPerfil: string | null };

const signToken = (user: { id: number; email: string; rol: string }): string =>
  jwt.sign({ id: user.id, email: user.email, rol: user.rol }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

export const authService = {
  async loginConGoogle(
    googleToken: string,
  ): Promise<{ token: string; usuario: UsuarioSafe; negocios: NegocioSafe[]; esNuevo: boolean }> {
    let googleId: string;
    let email: string;
    let nombre: string;

    const segments = googleToken.split('.');
    if (segments.length === 3) {
      // ID Token (JWT) — verify with Google's certificate
      const ticket = await googleClient.verifyIdToken({
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
      // Access Token (ya29...) — verify by calling Google's userinfo endpoint server-side
      const verifyRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!verifyRes.ok) {
        throw new UnauthorizedError('Token de Google inválido');
      }
      const verified = await verifyRes.json();
      if (!verified.sub || !verified.email) {
        throw new UnauthorizedError('Token de Google inválido');
      }
      googleId = verified.sub;
      email = verified.email;
      nombre = verified.name || email.split('@')[0];
    }

    let negocio = await authRepository.findNegocioByGoogleId(googleId);
    const esNuevo = !negocio;

    if (!negocio) {
      negocio = await authRepository.createNegocioWithAdmin(googleId, email, nombre);
    }

    let usuario = await authRepository.findUsuarioByNegocioAndGoogleId(negocio.id, googleId);
    if (!usuario) {
      // Safety net: user exists but has no junction record (e.g., after M:N migration)
      const existingUser = await usuariosRepository.findFirstByGoogleId(googleId);
      if (existingUser) {
        await usuarioNegocioRepository.upsertMembership(existingUser.id, negocio.id, 'ADMIN');
        usuario = await authRepository.findUsuarioById(existingUser.id);
      }
      if (!usuario) {
        throw new NotFoundError('Usuario del negocio');
      }
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    const negocios = await authRepository.findNegociosByUsuarioId(usuario.id);

    return { token, usuario, negocios, esNuevo };
  },

  async registrarConEmail(
    email: string,
    password: string,
  ): Promise<{ token: string; usuario: UsuarioSafe; negocios: NegocioSafe[]; esNuevo: boolean }> {
    const existente = await authRepository.findUsuarioByEmail(email);
    if (existente) {
      throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const nombre = email.split('@')[0];

    const negocio = await authRepository.createNegocioWithAdmin(
      `email-${email}`,
      email,
      'Mi Negocio',
      hashedPassword,
    );

    const usuario = await authRepository.findUsuarioByNegocioId(negocio.id);
    if (!usuario) {
      throw new NotFoundError('Usuario recién creado');
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    const negocios = await authRepository.findNegociosByUsuarioId(usuario.id);

    return { token, usuario, negocios, esNuevo: true };
  },

  async loginConEmail(
    email: string,
    password: string,
  ): Promise<{
    token: string;
    usuario: Pick<Usuario, 'id' | 'nombre' | 'email' | 'rol' | 'creadoEn'>;
    negocios: NegocioSafe[];
    esNuevo: boolean;
  }> {
    const usuario = await authRepository.findUsuarioByEmail(email);
    if (!usuario || !usuario.password) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const negocios = await authRepository.findNegociosByUsuarioId(usuario.id);
    if (negocios.length === 0) {
      throw new NotFoundError('Negocio');
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
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
  },

  async obtenerUsuarioActual(
    userId: number,
  ): Promise<{ usuario: UsuarioSafe; negocios: NegocioSafe[] }> {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const negocios = await authRepository.findNegociosByUsuarioId(userId);
    if (negocios.length === 0) {
      throw new NotFoundError('Negocio');
    }

    return { usuario, negocios };
  },

  async updateAvatar(
    userId: number,
    negocioId: number,
    base64Image: string,
  ): Promise<{ fotoPerfil: string }> {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await usuarioNegocioRepository.findByUsuarioIdAndNegocioId(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    // Si ya tenía foto en Cloudinary, podríamos intentar borrarla (opcional, por brevedad lo omitimos o lo borramos si guardamos el public_id. Cloudinary URL no es el public_id, requeriría parseo).

    // Subir a Cloudinary
    const fotoPerfil = await uploadBase64Image(base64Image, `wavio/users/${userId}`);

    // Actualizar BD
    await usuariosRepository.update(userId, { fotoPerfil });

    return { fotoPerfil };
  },

  async deleteAvatar(userId: number, negocioId: number): Promise<{ success: boolean }> {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await usuarioNegocioRepository.findByUsuarioIdAndNegocioId(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    await usuariosRepository.update(userId, { fotoPerfil: null });
    return { success: true };
  },

  async updateNombre(
    userId: number,
    negocioId: number,
    nombre: string,
  ): Promise<{ nombre: string }> {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }

    const membership = await usuarioNegocioRepository.findByUsuarioIdAndNegocioId(
      userId,
      negocioId,
    );
    if (!membership) {
      throw new NotFoundError('Usuario');
    }

    const updated = await usuariosRepository.update(userId, { nombre: nombre.trim() });
    return { nombre: updated.nombre };
  },
};
