import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/permissions.middleware';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/usuarios.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { paginate } from '../middleware/pagination';
import { validateBody } from '../middleware/validate';

const router = Router();

// Todas las rutas requieren auth + tenant + rol ADMIN
router.use(verificarToken, tenantMiddleware, requireAdmin);

const createUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'STAFF']).optional(),
});

const updateUserSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email('Email inválido').optional(),
  rol: z.enum(['ADMIN', 'STAFF']).optional(),
});

router.get('/', paginate, getAllUsers);
router.post('/', validateBody(createUserSchema), createUser);
router.put('/:id', validateBody(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);

export default router;
