import { Router } from 'express';
import { z } from 'zod';
import {
  loginConGoogle,
  loginConEmail,
  registrarConEmail,
  me,
  updateAvatar,
  deleteAvatar,
  updateNombre,
  googleMobileStart,
  googleMobileCallback,
  mobileTokenPoll,
} from '../controllers/auth.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';

const router = Router();

const googleLoginSchema = z.object({
  googleToken: z.string({ message: 'Token de Google requerido' }),
  userInfo: z.record(z.string(), z.unknown()).optional(),
});

const emailAuthSchema = z.object({
  email: z.string({ message: 'Email es requerido' }).email('Email inválido'),
  password: z
    .string({ message: 'Contraseña requerida' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Google OAuth
router.post('/google', validateBody(googleLoginSchema), loginConGoogle);

// Email / contraseña
router.post('/register', validateBody(emailAuthSchema), registrarConEmail);
router.post('/login', validateBody(emailAuthSchema), loginConEmail);

// Info del usuario autenticado
router.get('/me', verificarToken, me);
router.put(
  '/me/avatar',
  verificarToken,
  validateBody(z.object({ image: z.string() })),
  updateAvatar,
);
router.delete('/me/avatar', verificarToken, deleteAvatar);
router.patch(
  '/me/nombre',
  verificarToken,
  validateBody(
    z.object({ nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres') }),
  ),
  updateNombre,
);

// Google OAuth nativo para app móvil
router.get('/google-mobile', googleMobileStart);
router.get('/mobile-callback', googleMobileCallback);
router.get('/mobile-token', mobileTokenPoll);

export default router;
