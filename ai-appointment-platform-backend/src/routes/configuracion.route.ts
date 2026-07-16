import { Router } from 'express';
import { z } from 'zod';
import {
  getConfiguracion,
  updateConfiguracion,
  uploadQR,
} from '../controllers/configuracion.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireAdmin } from '../middleware/permissions.middleware';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(verificarToken, tenantMiddleware);

const updateConfiguracionSchema = z.object({
  trigger: z.string().min(1).optional(),
  mensajeBienvenida: z.string().optional(),
  mensajeConfirmacion: z.string().optional(),
  qrFotoUrl: z.string().nullable().optional(),
  cobrarAdelanto: z.boolean().optional(),
  porcentajeAdelanto: z.number().min(1).max(100).optional(),
  timezone: z.string().optional(),
  chatFlow: z.record(z.string(), z.unknown()).optional(),
});

const uploadQrSchema = z.object({
  imagen: z.string().min(1, 'La imagen es requerida'),
});

router.get('/', getConfiguracion);
router.patch('/', requireAdmin, validateBody(updateConfiguracionSchema), updateConfiguracion);
router.post('/qr', requireAdmin, validateBody(uploadQrSchema), uploadQR);

export default router;
