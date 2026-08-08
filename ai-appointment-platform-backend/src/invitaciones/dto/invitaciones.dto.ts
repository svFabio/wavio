import { z } from 'zod';

export const invitacionRolSchema = z.enum(['ADMIN', 'STAFF'], {
  message: 'Rol inválido. Debe ser ADMIN o STAFF',
});

export const InvitacionSchema = z.object({
  email: z.string({ message: 'Email es requerido' }).email('Email inválido'),
  rol: invitacionRolSchema.optional(),
});

export const AceptarInvitacionSchema = z.object({
  token: z.string({ message: 'Token es requerido' }).min(1, 'Token es requerido'),
  nombre: z
    .string({ message: 'Nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z
    .string({ message: 'Contraseña requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const ListarInvitacionesSchema = z.object({
  estado: z.enum(['PENDIENTE', 'ACEPTADA', 'CANCELADA', 'EXPIRADA']).optional(),
});

export type InvitacionDto = z.infer<typeof InvitacionSchema>;
export type AceptarInvitacionDto = z.infer<typeof AceptarInvitacionSchema>;
export type ListarInvitacionesDto = z.infer<typeof ListarInvitacionesSchema>;
