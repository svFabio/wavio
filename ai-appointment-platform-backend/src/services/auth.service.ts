import { authRepository } from '../repositories/auth.repository';
import { UnauthorizedError, ConflictError, NotFoundError } from '../domain/errors';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Usuario, Negocio } from '../domain/types';
import { usuariosRepository } from '../repositories/usuarios.repository';
import { uploadBase64Image, deleteImage } from '../lib/cloudinary';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const JWT_EXPIRES_IN = '7d';

export const authService = {
  async loginConGoogle(googleToken: string) {
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
        headers: { Authorization: `Bearer ${googleToken}` }
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

    const usuario = await authRepository.findUsuarioByNegocioAndGoogleId(negocio.id, googleId);
    if (!usuario) {
      throw new NotFoundError('Usuario del negocio');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, negocioId: negocio.id },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { token, usuario, negocio, esNuevo };
  },

  async registrarConEmail(email: string, password: string) {
    const existente = await authRepository.findUsuarioByEmail(email);
    if (existente) {
      throw new ConflictError('Ya existe una cuenta con ese email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nombre = email.split('@')[0];

    const negocio = await authRepository.createNegocioWithAdmin(
      `email-${email}`,
      email,
      'Mi Negocio',
      hashedPassword
    );

    const usuario = await authRepository.findUsuarioByNegocioId(negocio.id);
    if (!usuario) {
      throw new NotFoundError('Usuario recién creado');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, negocioId: negocio.id },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { token, usuario, negocio, esNuevo: true };
  },

  async loginConEmail(email: string, password: string) {
    const usuario = await authRepository.findUsuarioByEmail(email);
    if (!usuario || !usuario.password) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const negocio = await authRepository.findNegocioById(usuario.negocioId);
    if (!negocio) {
      throw new NotFoundError('Negocio');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, negocioId: negocio.id },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, negocioId: usuario.negocioId, creadoEn: usuario.creadoEn }, negocio, esNuevo: false };
  },

  async obtenerUsuarioActual(userId: number, negocioId: number) {
    const usuario = await authRepository.findUsuarioById(userId);
    const negocio = await authRepository.findNegocioById(negocioId);

    if (!usuario || !negocio) {
      throw new NotFoundError('Usuario o negocio');
    }

    return { usuario, negocio };
  },

  async updateAvatar(userId: number, negocioId: number, base64Image: string) {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario || usuario.negocioId !== negocioId) {
      throw new NotFoundError('Usuario');
    }

    // Si ya tenía foto en Cloudinary, podríamos intentar borrarla (opcional, por brevedad lo omitimos o lo borramos si guardamos el public_id. Cloudinary URL no es el public_id, requeriría parseo).
    
    // Subir a Cloudinary
    const fotoPerfil = await uploadBase64Image(base64Image, `wavio/users/${userId}`);

    // Actualizar BD
    await usuariosRepository.update(userId, { fotoPerfil });

    return { fotoPerfil };
  },

  async deleteAvatar(userId: number, negocioId: number) {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario || usuario.negocioId !== negocioId) {
      throw new NotFoundError('Usuario');
    }
    await usuariosRepository.update(userId, { fotoPerfil: null });
    return { success: true };
  },

  async updateNombre(userId: number, negocioId: number, nombre: string) {
    const usuario = await authRepository.findUsuarioById(userId);
    if (!usuario || usuario.negocioId !== negocioId) {
      throw new NotFoundError('Usuario');
    }
    const updated = await usuariosRepository.update(userId, { nombre: nombre.trim() });
    return { nombre: updated.nombre };
  }
};
