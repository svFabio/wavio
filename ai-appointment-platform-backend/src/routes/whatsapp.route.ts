import { Router } from 'express';
import {
  saveWhatsappCredentials,
  getWhatsappStatus,
  disconnectWhatsapp,
} from '../controllers/whatsapp.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación y estar asociadas a un tenant
router.use(verificarToken, tenantMiddleware);

router.get('/status', getWhatsappStatus);
router.post('/save-credentials', requireAdmin, saveWhatsappCredentials);
router.post('/disconnect', requireAdmin, disconnectWhatsapp);

export default router;
