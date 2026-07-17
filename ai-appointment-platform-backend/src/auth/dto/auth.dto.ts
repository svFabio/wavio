import { z } from 'zod';

export const googleLoginSchema = z.object({
  googleToken: z.string({ message: 'Token de Google requerido' }),
  userInfo: z.record(z.string(), z.unknown()).optional(),
});

export const emailAuthSchema = z.object({
  email: z.string({ message: 'Email es requerido' }).email('Email inválido'),
  password: z
    .string({ message: 'Contraseña requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const avatarSchema = z.object({
  image: z.string(),
});

export const nombreSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;
export type EmailAuthDto = z.infer<typeof emailAuthSchema>;
export type AvatarDto = z.infer<typeof avatarSchema>;
export type NombreDto = z.infer<typeof nombreSchema>;
