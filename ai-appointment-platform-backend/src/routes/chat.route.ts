import { Router } from 'express';
import { z } from 'zod';
import {
  getConversaciones,
  getMensajes,
  sendMensaje,
  deleteConversacion,
} from '../controllers/chat.controller';
import { verificarToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { paginate } from '../middleware/pagination';
import { validateBody } from '../middleware/validate';

const router = Router();

const enviarMensajeSchema = z.object({
  texto: z.string().min(1).max(5000),
});

router.use(verificarToken, tenantMiddleware);

router.get('/conversaciones', paginate, getConversaciones);
router.get('/mensajes/:jid', paginate, getMensajes);
router.post('/enviar/:jid', validateBody(enviarMensajeSchema), sendMensaje);
router.delete('/conversacion/:jid', deleteConversacion);

export default router;
