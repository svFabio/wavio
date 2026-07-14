import { usuariosRepository } from '../repositories/usuarios.repository';
import { ValidationError, ConflictError, NotFoundError } from '../domain/errors';
import { Rol } from '../domain/types';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (
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
}> => {
  const result = await usuariosRepository.findByNegocioId(negocioId, page, limit);
  return {
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  };
};

export const createUser = async (
  negocioId: number,
  data: { nombre?: string; email?: string; password?: string; rol?: string },
): Promise<{
  id: number;
  nombre: string;
  email: string;
  rol: string;
  creadoEn: Date;
  fotoPerfil: string | null;
}> => {
  const { nombre, email, password, rol } = data;

  if (!nombre || !email || !password) {
    throw new ValidationError('Nombre, email y contraseña son requeridos');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError('Formato de email inválido');
  }
  if (rol && !['ADMIN', 'STAFF'].includes(rol)) {
    throw new ValidationError('Rol inválido. Debe ser ADMIN o STAFF');
  }

  const existente = await usuariosRepository.findByEmail(email);
  if (existente) {
    throw new ConflictError('El email ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return usuariosRepository.create({
    negocioId,
    nombre,
    email,
    password: hashedPassword,
    rol: (rol || 'STAFF') as Rol,
  });
};

export const updateUser = async (
  negocioId: number,
  userId: number,
  data: { nombre?: string; email?: string; password?: string; rol?: string },
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
> => {
  const { nombre, email, password, rol } = data;

  const usuario = await usuariosRepository.findByIdAndNegocioId(userId, negocioId);
  if (!usuario) {
    throw new NotFoundError('Usuario');
  }

  const updateData: { nombre?: string; email?: string; password?: string; rol?: Rol } = {};
  if (nombre) updateData.nombre = nombre;
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Formato de email inválido');
    }
    const existente = await usuariosRepository.findByEmail(email);
    if (existente && existente.id !== userId) {
      throw new ConflictError('El email ya está registrado');
    }
    updateData.email = email;
  }
  if (password) updateData.password = await bcrypt.hash(password, 10);
  if (rol) {
    if (!['ADMIN', 'STAFF'].includes(rol)) {
      throw new ValidationError('Rol inválido');
    }
    updateData.rol = rol as Rol;
  }

  if (Object.keys(updateData).length === 0) {
    return usuario;
  }

  return usuariosRepository.update(userId, updateData);
};

export const deleteUser = async (
  negocioId: number,
  userId: number,
  requestingUserId: number,
): Promise<void> => {
  if (requestingUserId === userId) {
    throw new ValidationError('No puedes eliminar tu propio usuario');
  }

  const usuario = await usuariosRepository.findByIdAndNegocioId(userId, negocioId);
  if (!usuario) {
    throw new NotFoundError('Usuario');
  }

  await usuariosRepository.delete(userId);
};
