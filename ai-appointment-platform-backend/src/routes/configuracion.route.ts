import { Router } from 'express';
import {
  getConfiguracion,
  updateConfiguracion,
  uploadQR,
} from '../controllers/configuracion.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/permissions.middleware';

const router = Router();

router.use(verificarToken, tenantMiddleware);

router.get('/', getConfiguracion);
router.patch('/', requireAdmin, updateConfiguracion);
router.post('/qr', requireAdmin, uploadQR);

export default router;
