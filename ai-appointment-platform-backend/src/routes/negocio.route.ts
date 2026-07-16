import { Router } from 'express';
import { z } from 'zod';
import { configurarNegocio } from '../controllers/negocio.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/permissions.middleware';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(verificarToken, tenantMiddleware);

const configurarNegocioSchema = z.object({
  nombre: z.string().min(1, 'El nombre del negocio es requerido'),
});

router.patch('/configurar', requireAdmin, validateBody(configurarNegocioSchema), configurarNegocio);

export default router;
