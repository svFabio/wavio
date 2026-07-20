import { z } from 'zod';

export const createUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'STAFF']).optional(),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email('Email inválido').optional(),
  rol: z.enum(['ADMIN', 'STAFF']).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
