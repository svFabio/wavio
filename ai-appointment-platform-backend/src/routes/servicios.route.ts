import { Router } from 'express';
import { z } from 'zod';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody } from '../middleware/validate';
import { getAll, create, update, remove } from '../controllers/servicios.controller';

const router = Router();
router.use(verificarToken, tenantMiddleware);

const createServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  duracionMinutos: z.number().int().min(15, 'Duración mínima 15 minutos').max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
});

const updateServicioSchema = z.object({
  nombre: z.string().min(1).optional(),
  duracionMinutos: z.number().int().min(15).max(480).optional(),
  bufferMinutos: z.number().int().min(0).max(120).optional(),
  precio: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

router.get('/', getAll);
router.post('/', validateBody(createServicioSchema), create);
router.patch('/:id', validateBody(updateServicioSchema), update);
router.delete('/:id', remove);

export default router;
