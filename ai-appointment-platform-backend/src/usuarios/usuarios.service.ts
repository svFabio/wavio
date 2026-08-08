import { Injectable } from '@nestjs/common';
import { UsuariosRepository } from './usuarios.repository';
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from '../domain/errors';
import { Rol } from '../domain/types';
import { BCRYPT_SALT_ROUNDS } from '../config';
import bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepository: UsuariosRepository) {}

  async getAllUsers(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Array<{
      id: number;
      nombre: string;
      email: string;
      rol: string;
      creadoEn: Date;
      fotoPerfil: string | null;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.usuariosRepository.findByNegocioId(negocioId, page, limit);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async createUser(
    negocioId: number,
    data: { nombre?: string; email?: string; password?: string; rol?: string },
    requestingRol: string,
  ): Promise<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
    creadoEn: Date;
    fotoPerfil: string | null;
  }> {
    const { nombre, email, password, rol } = data;

    if (!nombre || !email || !password) {
      throw new ValidationError('Nombre, email y contraseña son requeridos');
    }

    if (rol && !['ADMIN', 'STAFF'].includes(rol)) {
      throw new ValidationError('Rol inválido. Debe ser ADMIN o STAFF');
    }

    if (requestingRol === 'STAFF') {
      throw new ForbiddenError('No tienes permisos para crear usuarios');
    }

    if (requestingRol === 'ADMIN' && rol === 'ADMIN') {
      throw new ForbiddenError('Solo el propietario puede crear administradores');
    }

    const existente = await this.usuariosRepository.findByEmail(email);
    if (existente) {
      throw new ConflictError('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return this.usuariosRepository.create({
      negocioId,
      nombre,
      email,
      password: hashedPassword,
      rol: (rol || 'STAFF') as Rol,
    });
  }

  async updateUser(
    negocioId: number,
    userId: number,
    data: { nombre?: string; email?: string; password?: string; rol?: string },
    requestingRol: string,
  ): Promise<
    | { id: number; nombre: string; email: string; rol: string; creadoEn: Date }
    | {
        id: number;
        nombre: string;
        email: string;
        rol: string;
        creadoEn: Date;
        fotoPerfil: string | null;
      }
  > {
    const { nombre, email, password, rol } = data;

    const target = await this.usuariosRepository.findByIdAndNegocioId(userId, negocioId);
    if (!target) {
      throw new NotFoundError('Usuario');
    }

    const updateData: { nombre?: string; email?: string; password?: string; rol?: Rol } = {};
    if (nombre) updateData.nombre = nombre;
    if (email) {
      const existente = await this.usuariosRepository.findByEmail(email);
      if (existente && existente.id !== userId) {
        throw new ConflictError('El email ya está registrado');
      }
      updateData.email = email;
    }
    if (password) updateData.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    if (rol) {
      if (!['ADMIN', 'STAFF'].includes(rol)) {
        throw new ValidationError('Rol inválido');
      }
      if (target.rol === 'OWNER') {
        throw new ForbiddenError('El propietario no puede ser modificado');
      }
      if (requestingRol === 'ADMIN' && (target.rol === 'ADMIN' || rol === 'ADMIN')) {
        throw new ForbiddenError('Solo el propietario puede gestionar administradores');
      }
      if ((target.rol === 'ADMIN' || target.rol === 'OWNER') && rol !== target.rol) {
        const admins = await this.usuariosRepository.countAdminsByNegocio(negocioId);
        if (admins <= 1) {
          throw new ForbiddenError('No puedes degradar al último administrador');
        }
      }
      updateData.rol = rol as Rol;
    }

    if (Object.keys(updateData).length === 0) {
      return target;
    }

    return this.usuariosRepository.update(userId, updateData);
  }

  async deleteUser(
    negocioId: number,
    userId: number,
    requestingUserId: number,
    requestingRol: string,
  ): Promise<void> {
    if (requestingUserId === userId) {
      throw new ValidationError('No puedes eliminar tu propio usuario');
    }

    const target = await this.usuariosRepository.findByIdAndNegocioId(userId, negocioId);
    if (!target) {
      throw new NotFoundError('Usuario');
    }

    if (target.rol === 'OWNER') {
      throw new ForbiddenError('El propietario no puede ser eliminado');
    }

    if (requestingRol === 'ADMIN' && target.rol === 'ADMIN') {
      throw new ForbiddenError('Solo el propietario puede eliminar administradores');
    }

    if (target.rol === 'ADMIN') {
      const admins = await this.usuariosRepository.countAdminsByNegocio(negocioId);
      if (admins <= 1) {
        throw new ForbiddenError('No puedes eliminar al último administrador');
      }
    }

    await this.usuariosRepository.delete(userId);
  }
}
