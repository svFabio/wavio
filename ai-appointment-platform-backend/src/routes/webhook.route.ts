import { Router } from 'express';
import { verifyWebhook, handleWebhook } from '../controllers/webhook.controller';

const router = Router();

// GET para verificación desde el dashboard de Meta
router.get('/', verifyWebhook);

// POST para recibir mensajes y eventos
router.post('/', handleWebhook);

export default router;
