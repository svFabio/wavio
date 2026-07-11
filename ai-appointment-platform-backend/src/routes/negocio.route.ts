import { Router } from 'express';
import { configurarNegocio } from '../controllers/negocio.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/permissions.middleware';

const router = Router();

router.use(verificarToken, tenantMiddleware);

router.patch('/configurar', requireAdmin, configurarNegocio);

export default router;
